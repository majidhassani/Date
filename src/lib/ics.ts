/**
 * Minimal RFC 5545 (.ics) event generator. Times are emitted in UTC (Z),
 * derived from the canonical `finalDatetimeUtc`, so any calendar app renders
 * them correctly in the viewer's local timezone.
 */

function toIcsUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export type IcsInput = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startUtc: Date;
  durationMinutes: number;
};

export function buildIcs(input: IcsInput): string {
  const start = input.startUtc;
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Daavat Nilou//Invitation//FA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(input.uid)}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    input.description ? `DESCRIPTION:${escapeIcs(input.description)}` : "",
    input.location ? `LOCATION:${escapeIcs(input.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
