import { z } from "zod";

/**
 * Environment configuration with validation.
 *
 * Parsing is lenient (defaults + optionals) so `next build` never crashes on a
 * missing optional secret. Hard requirements for a fully-functional runtime are
 * enforced separately by `assertServerEnv()` (called from instrumentation.ts).
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_TIMEZONE: z.string().default("Asia/Tehran"),

  INVITATION_SLUG: z.string().default(""),
  INVITEE_NAME: z.string().default("نیلو"),
  OWNER_NAME: z.string().default("مجید"),
  OWNER_PHONE_LOCAL: z.string().default("09129284402"),
  OWNER_PHONE_E164: z.string().default("+989129284402"),

  ADMIN_EMAIL: z.string().default(""),
  // Provide EITHER a pre-computed bcrypt hash (preferred for production) …
  ADMIN_PASSWORD_HASH: z.string().default(""),
  // … OR a plaintext password (hashed in-memory at startup — easiest self-host).
  ADMIN_PASSWORD: z.string().default(""),
  SESSION_SECRET: z.string().default(""),

  PHONE_ENCRYPTION_KEY: z.string().default(""),

  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_CHAT_ID: z.string().default(""),

  EMAIL_PROVIDER: z.string().default(""),
  EMAIL_FROM: z.string().default(""),
  EMAIL_TO: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),

  SKIP_ENV_VALIDATION: z.string().default(""),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // This should not happen given all fields have defaults, but guard anyway.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

/** True when the browser-safe app URL is available. */
export const APP_URL = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const isTelegramConfigured = Boolean(
  env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID,
);

export const isEmailConfigured =
  env.EMAIL_PROVIDER.toLowerCase() === "smtp" &&
  Boolean(env.SMTP_HOST && env.EMAIL_FROM && env.EMAIL_TO);

/**
 * Enforce the presence of secrets required for a secure production runtime.
 * Called once from instrumentation.ts. In development we warn; in production we
 * throw so an unsafe deployment fails fast.
 */
export function assertServerEnv(): void {
  if (env.SKIP_ENV_VALIDATION === "1") return;

  const problems: string[] = [];

  if (!env.DATABASE_URL) problems.push("DATABASE_URL is required.");
  if (env.SESSION_SECRET.length < 32)
    problems.push("SESSION_SECRET must be at least 32 characters.");
  if (!env.ADMIN_PASSWORD_HASH && !env.ADMIN_PASSWORD)
    problems.push(
      "Set ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD for admin login.",
    );

  // PHONE_ENCRYPTION_KEY must decode to exactly 32 bytes when present.
  if (env.PHONE_ENCRYPTION_KEY) {
    try {
      const raw = Buffer.from(env.PHONE_ENCRYPTION_KEY, "base64");
      if (raw.length !== 32)
        problems.push("PHONE_ENCRYPTION_KEY must be 32 bytes (base64-encoded).");
    } catch {
      problems.push("PHONE_ENCRYPTION_KEY must be valid base64.");
    }
  } else {
    problems.push(
      "PHONE_ENCRYPTION_KEY is required to accept phone numbers (base64, 32 bytes).",
    );
  }

  if (problems.length === 0) return;

  const message = "Environment problems:\n - " + problems.join("\n - ");
  if (isProd) {
    throw new Error(message);
  } else {
    console.warn("[env] " + message);
  }
}
