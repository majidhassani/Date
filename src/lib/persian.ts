const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/** Convert Latin digits in a string/number to Persian digits. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!);
}

/** Convert Persian/Arabic-Indic digits to Latin digits (for parsing input). */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA_DIGITS.indexOf(d as (typeof FA_DIGITS)[number]);
    if (fa > -1) return String(fa);
    const ar = AR_DIGITS.indexOf(d as (typeof AR_DIGITS)[number]);
    return ar > -1 ? String(ar) : d;
  });
}
