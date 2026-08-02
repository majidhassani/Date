import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env, isProd } from "./env";
import { logger } from "./logger";

const COOKIE_NAME = "nilou_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// A valid-format bcrypt hash of a random value, used to equalize timing when no
// admin hash is configured or the email is unknown (mitigates user enumeration).
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO4S1E2Uo2Vf7lJ5F4o9Z9m0N3o5t2yq";

function getSecret(): Uint8Array {
  if (env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short (needs 32+ chars).");
  }
  return new TextEncoder().encode(env.SESSION_SECRET);
}

// Resolve the admin bcrypt hash: use ADMIN_PASSWORD_HASH if given, otherwise
// derive one once from the plaintext ADMIN_PASSWORD (cached in memory).
let derivedHash: string | null = null;
async function getAdminHash(): Promise<string | null> {
  if (env.ADMIN_PASSWORD_HASH) return env.ADMIN_PASSWORD_HASH;
  if (env.ADMIN_PASSWORD) {
    if (!derivedHash) derivedHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    return derivedHash;
  }
  return null;
}

/** Verify admin email + password in near-constant time. */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const emailOk =
    Boolean(env.ADMIN_EMAIL) &&
    email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase();

  const configuredHash = await getAdminHash();
  // Always run a compare to keep timing uniform even when unconfigured.
  const passOk = await bcrypt.compare(password, configuredHash || DUMMY_HASH);

  return emailOk && Boolean(configuredHash) && passOk;
}

export async function createAdminSession(email: string): Promise<void> {
  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export type AdminSession = { email: string };

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return { email: String(payload.email ?? payload.sub ?? "admin") };
  } catch (err) {
    logger.debug("Invalid admin session token", { err: String(err) });
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Hash a plaintext password (used by the CLI helper script). */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 12);
}
