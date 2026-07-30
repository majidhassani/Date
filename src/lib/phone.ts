import { toEnglishDigits, toPersianDigits } from "./persian";

export type NormalizedPhone = {
  /** E.164 form, e.g. "+989123456789" */
  e164: string;
  /** Local form, e.g. "09123456789" */
  local: string;
  /** Last 4 digits, e.g. "6789" */
  last4: string;
};

/**
 * Normalize an Iranian mobile number to E.164.
 * Accepts: 09123456789, +989123456789, 00989123456789, 989123456789,
 * 9123456789 — with Persian digits, spaces and dashes tolerated.
 * Returns `null` when the input is not a valid Iranian mobile number.
 */
export function normalizeIranMobile(input: string): NormalizedPhone | null {
  if (!input) return null;

  // Normalize digits and strip common separators.
  let s = toEnglishDigits(input.trim()).replace(/[\s\-()]/g, "");

  // Reduce leading international prefixes to the national significant number.
  if (s.startsWith("+98")) s = s.slice(3);
  else if (s.startsWith("0098")) s = s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")) s = s.slice(1);

  // National significant number must be exactly "9XXXXXXXXX" (10 digits).
  if (!/^9\d{9}$/.test(s)) return null;

  const e164 = `+98${s}`;
  const local = `0${s}`;
  const last4 = s.slice(-4);
  return { e164, local, last4 };
}

/** True when the input is a valid Iranian mobile number. */
export function isValidIranMobile(input: string): boolean {
  return normalizeIranMobile(input) !== null;
}

/**
 * Masked display from the last 4 digits: "۰۹۱۲ *** ۴۴۰۲".
 * Only the last 4 digits are known to the client for masked rendering.
 */
export function maskFromLast4(last4: string): string {
  const safe = toEnglishDigits(last4).replace(/\D/g, "").slice(-4);
  return `${toPersianDigits("0912")} *** ${toPersianDigits(safe.padStart(4, "0"))}`;
}

/**
 * Group a local number "09129284402" for readable display:
 * "۰۹۱۲ ۹۲۸ ۴۴۰۲" (Persian digits).
 */
export function formatLocalGrouped(local: string): string {
  const digits = toEnglishDigits(local).replace(/\D/g, "");
  if (digits.length !== 11) return toPersianDigits(local);
  const a = digits.slice(0, 4);
  const b = digits.slice(4, 7);
  const c = digits.slice(7, 11);
  return `${toPersianDigits(a)} ${toPersianDigits(b)} ${toPersianDigits(c)}`;
}

/** Convert an E.164 Iranian number to its local 0-prefixed form. */
export function e164ToLocal(e164: string): string {
  const digits = toEnglishDigits(e164).replace(/\D/g, "");
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  return digits;
}
