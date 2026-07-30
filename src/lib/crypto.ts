import crypto from "node:crypto";
import { env } from "./env";

/**
 * Authenticated application-level encryption for phone numbers (AES-256-GCM).
 *
 * Payload format (dot-separated, versioned):
 *   v1.<iv-base64>.<authTag-base64>.<ciphertext-base64>
 *
 * The key comes from PHONE_ENCRYPTION_KEY (base64, exactly 32 bytes) and never
 * leaves the server. A fresh 96-bit IV is generated for every value.
 */

const VERSION = "v1";
const IV_BYTES = 12;

function getKey(): Buffer {
  if (!env.PHONE_ENCRYPTION_KEY) {
    throw new Error("PHONE_ENCRYPTION_KEY is not configured.");
  }
  const raw = Buffer.from(env.PHONE_ENCRYPTION_KEY, "base64");
  if (raw.length !== 32) {
    throw new Error("PHONE_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return raw;
}

export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptString(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted payload.");
  }
  const [version, ivB64, tagB64, dataB64] = parts;
  if (version !== VERSION || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Unsupported or malformed encrypted payload.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** True if the current key can decrypt this payload (integrity + auth check). */
export function canDecrypt(payload: string | null | undefined): boolean {
  if (!payload) return false;
  try {
    decryptString(payload);
    return true;
  } catch {
    return false;
  }
}
