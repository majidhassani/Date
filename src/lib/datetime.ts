import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toJalaali } from "jalaali-js";
import { toPersianDigits } from "./persian";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TEHRAN_TZ = "Asia/Tehran";

/** Persian weekday names indexed by dayjs `day()` (0 = Sunday … 6 = Saturday). */
const WEEKDAY_FA: Record<number, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
};

/** Jalali month names (1-indexed). */
const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export type LocalDateInfo = {
  /** Gregorian local date in Tehran, "YYYY-MM-DD". Canonical key for a day. */
  localDate: string;
  weekdayIndex: number;
  weekdayFa: string;
  jy: number;
  jm: number;
  jd: number;
  /** e.g. "۹ مرداد" */
  jalaliShort: string;
  /** e.g. "جمعه ۹ مرداد" */
  jalaliWithWeekday: string;
  /** e.g. "جمعه ۹ مرداد ۱۴۰۳" */
  jalaliFull: string;
};

/** Current moment in the Tehran timezone. */
export function nowTehran() {
  return dayjs().tz(TEHRAN_TZ);
}

/** Local Tehran date string "YYYY-MM-DD" for `days` from today (0 = today). */
export function localDateAfterDays(days: number): string {
  return dayjs().tz(TEHRAN_TZ).add(days, "day").format("YYYY-MM-DD");
}

/**
 * Describe a Gregorian local date ("YYYY-MM-DD", interpreted in Tehran) with
 * Jalali labels and Persian digits.
 */
export function describeLocalDate(localDate: string): LocalDateInfo {
  const d = dayjs.tz(localDate, "YYYY-MM-DD", TEHRAN_TZ);
  const { jy, jm, jd } = toJalaali(d.year(), d.month() + 1, d.date());
  const weekdayIndex = d.day();
  const weekdayFa = WEEKDAY_FA[weekdayIndex] ?? "";
  const monthName = JALALI_MONTHS[jm - 1] ?? "";

  const jalaliShort = `${toPersianDigits(jd)} ${monthName}`;
  const jalaliWithWeekday = `${weekdayFa} ${jalaliShort}`;
  const jalaliFull = `${weekdayFa} ${jalaliShort} ${toPersianDigits(jy)}`;

  return {
    localDate,
    weekdayIndex,
    weekdayFa,
    jy,
    jm,
    jd,
    jalaliShort,
    jalaliWithWeekday,
    jalaliFull,
  };
}

/**
 * Convert a Tehran-local date + time to a canonical UTC instant.
 * Uses the timezone plugin so any offset/DST rule is applied correctly.
 */
export function localToUtc(localDate: string, localTime: string): Date {
  const d = dayjs.tz(`${localDate} ${localTime}`, "YYYY-MM-DD HH:mm", TEHRAN_TZ);
  return d.toDate();
}

/** Format a UTC instant back to a Persian Jalali label in Tehran time. */
export function formatUtcAsJalali(
  datetimeUtc: Date | string,
  timeZone: string = TEHRAN_TZ,
): { dateLabel: string; timeLabel: string; full: string } {
  const d = dayjs.utc(datetimeUtc).tz(timeZone);
  const info = describeLocalDate(d.format("YYYY-MM-DD"));
  const timeLabel = toPersianDigits(d.format("HH:mm"));
  return {
    dateLabel: info.jalaliWithWeekday,
    timeLabel,
    full: `${info.jalaliWithWeekday}، ساعت ${timeLabel}`,
  };
}

/** Human label for a local date + time, e.g. "جمعه ۹ مرداد، ساعت ۱۸:۰۰". */
export function formatLocalDateTimeLabel(
  localDate: string,
  localTime: string,
): string {
  const info = describeLocalDate(localDate);
  return `${info.jalaliWithWeekday}، ساعت ${toPersianDigits(localTime)}`;
}

export type DateOption = {
  localDate: string;
  kind: "quick" | "weekday";
  /** short Persian tag e.g. "فردا" or "نزدیک‌ترین جمعه" */
  tag: string;
  info: LocalDateInfo;
};

/** Next occurrence (1..7 days ahead) of a given dayjs weekday index. */
function nextWeekdayLocalDate(targetDow: number): string {
  const base = dayjs().tz(TEHRAN_TZ);
  for (let i = 1; i <= 7; i++) {
    const d = base.add(i, "day");
    if (d.day() === targetDow) return d.format("YYYY-MM-DD");
  }
  // Unreachable — a matching weekday always exists within 7 days.
  return base.add(7, "day").format("YYYY-MM-DD");
}

/**
 * Build the quick-choice and upcoming-weekday date options, computed live in
 * the Tehran timezone. Weekday options that duplicate a quick choice are
 * removed so no date appears twice.
 */
export function buildDateOptions(): { quick: DateOption[]; weekdays: DateOption[] } {
  const quick: DateOption[] = [
    { days: 1, tag: "فردا" },
    { days: 2, tag: "پس‌فردا" },
    { days: 3, tag: "سه روز دیگه" },
  ].map(({ days, tag }) => {
    const localDate = localDateAfterDays(days);
    return { localDate, kind: "quick" as const, tag, info: describeLocalDate(localDate) };
  });

  const quickDates = new Set(quick.map((q) => q.localDate));

  const weekdayDefs: { dow: number; tag: string }[] = [
    { dow: 5, tag: "نزدیک‌ترین جمعه" },
    { dow: 6, tag: "نزدیک‌ترین شنبه" },
    { dow: 0, tag: "نزدیک‌ترین یکشنبه" },
  ];

  const weekdays: DateOption[] = weekdayDefs
    .map(({ dow, tag }) => {
      const localDate = nextWeekdayLocalDate(dow);
      return {
        localDate,
        kind: "weekday" as const,
        tag,
        info: describeLocalDate(localDate),
      };
    })
    // Avoid duplicates when a quick choice already covers that weekday.
    .filter((w) => !quickDates.has(w.localDate));

  return { quick, weekdays };
}

/** Validate a "YYYY-MM-DD" string represents a real, future-or-today Tehran date. */
export function isValidFutureLocalDate(localDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return false;
  const d = dayjs.tz(localDate, "YYYY-MM-DD", TEHRAN_TZ);
  if (!d.isValid()) return false;
  const today = dayjs().tz(TEHRAN_TZ).startOf("day");
  // Allow today onward (inviting for a past date makes no sense).
  return !d.startOf("day").isBefore(today);
}
