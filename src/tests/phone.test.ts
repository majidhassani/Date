import { describe, it, expect } from "vitest";
import {
  normalizeIranMobile,
  isValidIranMobile,
  e164ToLocal,
  formatLocalGrouped,
  maskFromLast4,
} from "@/lib/phone";

describe("normalizeIranMobile", () => {
  it("accepts the common local format", () => {
    expect(normalizeIranMobile("09123456789")?.e164).toBe("+989123456789");
  });

  it("accepts +98 international format", () => {
    const n = normalizeIranMobile("+989123456789");
    expect(n?.e164).toBe("+989123456789");
    expect(n?.local).toBe("09123456789");
    expect(n?.last4).toBe("6789");
  });

  it("accepts 0098 and 98 prefixes", () => {
    expect(normalizeIranMobile("00989123456789")?.e164).toBe("+989123456789");
    expect(normalizeIranMobile("989123456789")?.e164).toBe("+989123456789");
  });

  it("tolerates spaces, dashes and Persian digits", () => {
    expect(normalizeIranMobile("0912 345 6789")?.e164).toBe("+989123456789");
    expect(normalizeIranMobile("۰۹۱۲۳۴۵۶۷۸۹")?.e164).toBe("+989123456789");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeIranMobile("0812345678")).toBeNull();
    expect(normalizeIranMobile("12345")).toBeNull();
    expect(normalizeIranMobile("")).toBeNull();
    expect(isValidIranMobile("hello")).toBe(false);
  });
});

describe("phone formatting", () => {
  it("converts e164 to local", () => {
    expect(e164ToLocal("+989129284402")).toBe("09129284402");
  });

  it("groups the local number with Persian digits", () => {
    expect(formatLocalGrouped("09129284402")).toBe("۰۹۱۲ ۹۲۸ ۴۴۰۲");
  });

  it("masks from last 4 digits", () => {
    expect(maskFromLast4("4402")).toContain("***");
    expect(maskFromLast4("4402")).toContain("۴۴۰۲");
  });
});
