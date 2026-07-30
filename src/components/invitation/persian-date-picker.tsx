"use client";

import * as React from "react";
import { toGregorian, jalaaliMonthLength, toJalaali } from "jalaali-js";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

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
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const selectClass = cn(
  "h-11 w-full rounded-md border border-input bg-surface px-3 text-base text-foreground shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/**
 * Accessible Jalali date picker (three native selects). Emits a Gregorian
 * "YYYY-MM-DD" local date so the rest of the app stays on one canonical format.
 */
export function PersianDatePicker({
  value,
  onChange,
  idPrefix = "jdate",
}: {
  value: string | null;
  onChange: (localDate: string) => void;
  idPrefix?: string;
}) {
  const nowJalali = React.useMemo(() => toJalaali(new Date()), []);

  // Derive the currently-shown Jalali parts from the Gregorian value, if any.
  const current = React.useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [gy, gm, gd] = value.split("-").map(Number) as [number, number, number];
      return toJalaali(gy, gm, gd);
    }
    return { jy: nowJalali.jy, jm: nowJalali.jm, jd: nowJalali.jd };
  }, [value, nowJalali]);

  const years = [nowJalali.jy, nowJalali.jy + 1];
  const daysInMonth = jalaaliMonthLength(current.jy, current.jm);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function emit(jy: number, jm: number, jd: number) {
    const maxDay = jalaaliMonthLength(jy, jm);
    const safeDay = Math.min(jd, maxDay);
    const g = toGregorian(jy, jm, safeDay);
    onChange(`${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-y`} className="text-xs text-muted-foreground">
          سال
        </label>
        <select
          id={`${idPrefix}-y`}
          className={selectClass}
          value={current.jy}
          onChange={(e) => emit(Number(e.target.value), current.jm, current.jd)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {toPersianDigits(y)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-m`} className="text-xs text-muted-foreground">
          ماه
        </label>
        <select
          id={`${idPrefix}-m`}
          className={selectClass}
          value={current.jm}
          onChange={(e) => emit(current.jy, Number(e.target.value), current.jd)}
        >
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-d`} className="text-xs text-muted-foreground">
          روز
        </label>
        <select
          id={`${idPrefix}-d`}
          className={selectClass}
          value={Math.min(current.jd, daysInMonth)}
          onChange={(e) => emit(current.jy, current.jm, Number(e.target.value))}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {toPersianDigits(d)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
