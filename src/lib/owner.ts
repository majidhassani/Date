import "server-only";
import { env } from "./env";
import { e164ToLocal, formatLocalGrouped, normalizeIranMobile } from "./phone";
import type { OwnerContact } from "./types";

/**
 * Owner (Majid) contact details. Server-only: this must never be bundled into
 * client code or exposed publicly. It is surfaced to Nilou strictly after she
 * accepts, via a server component / server action that gates on ACCEPTED state.
 */
export type { OwnerContact };

export function getOwnerContact(): OwnerContact {
  const normalized = normalizeIranMobile(env.OWNER_PHONE_E164 || env.OWNER_PHONE_LOCAL);
  const e164 = normalized?.e164 ?? env.OWNER_PHONE_E164 ?? "+989129284402";
  const local = normalized?.local ?? e164ToLocal(e164);
  const waNumber = e164.replace("+", ""); // wa.me expects digits only

  return {
    name: env.OWNER_NAME || "مجید",
    e164,
    local,
    display: formatLocalGrouped(local),
    telHref: `tel:${e164}`,
    smsHref: `sms:${e164}`,
    whatsappHref: `https://wa.me/${waNumber}`,
  };
}
