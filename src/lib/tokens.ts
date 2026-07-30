import crypto from "node:crypto";
import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/o/1/l/i) for human-friendly but non-guessable slugs.
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const nanoidSlug = customAlphabet(SLUG_ALPHABET, 12);

/** Human-readable but non-guessable invitation slug, e.g. "nilou-k7m3xp9qas2r". */
export function generateSlug(prefix = "nilou"): string {
  return `${prefix}-${nanoidSlug()}`;
}

/** URL-safe secure edit token (192 bits of entropy). The raw value is shown once. */
export function generateEditToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** SHA-256 hex hash — used to store the edit token without keeping the raw value. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison of two hex-encoded hashes of equal length. */
export function safeCompareHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Idempotency key for a submission attempt. */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/** Short request id for correlating logs and user-facing error references. */
export function generateRequestId(): string {
  return crypto.randomBytes(6).toString("hex");
}
