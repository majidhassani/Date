import { describe, it, expect } from "vitest";
import {
  localToUtc,
  describeLocalDate,
  buildDateOptions,
  formatUtcAsJalali,
  isValidFutureLocalDate,
} from "@/lib/datetime";
import { toPersianDigits, toEnglishDigits } from "@/lib/persian";

describe("persian digits", () => {
  it("converts to and from Persian digits", () => {
    expect(toPersianDigits("18:30")).toBe("۱۸:۳۰");
    expect(toEnglishDigits("۰۹۱۲")).toBe("0912");
  });
});

describe("localToUtc (Asia/Tehran, fixed +03:30, no DST since 2022)", () => {
  it("converts an evening slot correctly", () => {
    // 2024-08-01 18:00 Tehran => 14:30 UTC
    expect(localToUtc("2024-08-01", "18:00").toISOString()).toBe(
      "2024-08-01T14:30:00.000Z",
    );
  });

  it("has no summer DST shift", () => {
    // 2024-07-15 12:00 Tehran => 08:30 UTC
    expect(localToUtc("2024-07-15", "12:00").toISOString()).toBe(
      "2024-07-15T08:30:00.000Z",
    );
  });

  it("round-trips through the Jalali formatter", () => {
    const utc = localToUtc("2024-08-01", "18:00");
    const f = formatUtcAsJalali(utc);
    expect(f.timeLabel).toBe("۱۸:۰۰");
    expect(f.full).toContain("ساعت ۱۸:۰۰");
  });
});

describe("describeLocalDate", () => {
  it("produces a Jalali label with a valid weekday", () => {
    const info = describeLocalDate("2024-08-01");
    // 1403-05-11
    expect(info.jy).toBe(1403);
    expect(info.jm).toBe(5);
    expect(info.jd).toBe(11);
    expect(info.jalaliShort).toContain("مرداد");
    expect(["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]).toContain(
      info.weekdayFa,
    );
  });
});

describe("buildDateOptions", () => {
  it("returns 3 quick options and de-duplicates weekday overlaps", () => {
    const { quick, weekdays } = buildDateOptions();
    expect(quick).toHaveLength(3);
    const quickDates = new Set(quick.map((q) => q.localDate));
    // No weekday option duplicates a quick option.
    for (const w of weekdays) {
      expect(quickDates.has(w.localDate)).toBe(false);
    }
    // All localDates are unique across the combined set.
    const all = [...quick, ...weekdays].map((o) => o.localDate);
    expect(new Set(all).size).toBe(all.length);
  });

  it("only offers future dates", () => {
    const { quick, weekdays } = buildDateOptions();
    for (const o of [...quick, ...weekdays]) {
      expect(isValidFutureLocalDate(o.localDate)).toBe(true);
    }
  });
});
