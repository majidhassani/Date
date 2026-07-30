import "server-only";
import { ACTIVITIES, type ActivityDef, DEFAULT_TIME_SLOTS } from "./config";
import { buildDateOptions, type DateOption } from "./datetime";

/** Time slots, configurable via the TIME_SLOTS env var (comma-separated HH:mm). */
export function getConfiguredTimeSlots(): string[] {
  const raw = process.env.TIME_SLOTS?.trim();
  if (!raw) return [...DEFAULT_TIME_SLOTS];
  const slots = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s));
  return slots.length > 0 ? slots : [...DEFAULT_TIME_SLOTS];
}

/** Fully-serializable public config handed to client components. No secrets. */
export type PublicInvitationConfig = {
  slug: string;
  inviteeName: string;
  ownerName: string;
  status: string;
  hasResponded: boolean;
  activities: ActivityDef[];
  timeSlots: string[];
  dateOptions: { quick: DateOption[]; weekdays: DateOption[] };
};

export function buildPublicConfig(invitation: {
  slug: string;
  inviteeName: string;
  ownerName: string;
  status: string;
  responses: { id: string }[];
}): PublicInvitationConfig {
  return {
    slug: invitation.slug,
    inviteeName: invitation.inviteeName,
    ownerName: invitation.ownerName,
    status: invitation.status,
    hasResponded: invitation.responses.length > 0,
    activities: ACTIVITIES,
    timeSlots: getConfiguredTimeSlots(),
    dateOptions: buildDateOptions(),
  };
}
