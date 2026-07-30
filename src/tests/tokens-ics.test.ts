import { describe, it, expect } from "vitest";
import {
  generateSlug,
  generateEditToken,
  hashToken,
  safeCompareHex,
} from "@/lib/tokens";
import { buildIcs } from "@/lib/ics";

describe("tokens", () => {
  it("generates readable, non-guessable slugs", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^nilou-[a-z2-9]{12}$/);
    expect(generateSlug()).not.toBe(generateSlug());
  });

  it("hashes tokens deterministically", () => {
    const token = generateEditToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toHaveLength(64);
  });

  it("compares hashes in constant time", () => {
    const a = hashToken("a");
    expect(safeCompareHex(a, a)).toBe(true);
    expect(safeCompareHex(a, hashToken("b"))).toBe(false);
    expect(safeCompareHex(a, "abc")).toBe(false);
  });
});

describe("ics", () => {
  it("emits a UTC DTSTART matching the instant", () => {
    const ics = buildIcs({
      uid: "test@daavat",
      title: "قهوه با نیلو",
      startUtc: new Date("2024-08-01T14:30:00.000Z"),
      durationMinutes: 90,
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20240801T143000Z");
    expect(ics).toContain("DTEND:20240801T160000Z");
    expect(ics).toContain("SUMMARY:قهوه با نیلو");
  });
});
