import type {
  AvailabilityChoice,
  Response as ResponseModel,
} from "@prisma/client";
import { ACTIVITY_BY_ID, type ActivityId } from "../config";
import { formatLocalDateTimeLabel, formatUtcAsJalali } from "../datetime";
import { toPersianDigits } from "../persian";

type ResponseWithChoices = ResponseModel & {
  availabilityChoices: AvailabilityChoice[];
};

/**
 * Build the private owner notification text.
 * `phone` is the decrypted number (or null) — included ONLY when Nilou consented.
 * The caller is responsible for the consent check + decryption.
 */
export function buildOwnerMessage(
  response: ResponseWithChoices,
  phone: string | null,
): { subject: string; text: string } {
  const submittedAt = formatUtcAsJalali(response.submittedAt).full;

  if (response.answer === "DECLINED") {
    const text = [
      "نیلو فعلاً دعوت رو نپذیرفت.",
      "",
      `تعداد کلیک روی گزینه نه: ${toPersianDigits(response.noClickCount)}`,
      `زمان ثبت: ${submittedAt}`,
      `شناسه پاسخ: ${response.id}`,
    ].join("\n");
    return { subject: "دعوت نیلو — پاسخ منفی", text };
  }

  const activity =
    response.activityType && response.activityType !== "CUSTOM"
      ? ACTIVITY_BY_ID[response.activityType as ActivityId]?.title ??
        response.activityType
      : "انتخاب با تو";

  const activityLine = response.customActivity
    ? `${activity} — ${response.customActivity}`
    : activity;

  const choices = [...response.availabilityChoices].sort((a, b) => a.rank - b.rank);
  const choiceLabel = (rank: number) => {
    const c = choices.find((x) => x.rank === rank);
    return c ? formatLocalDateTimeLabel(c.localDate, c.localTime) : "ثبت نشده";
  };

  const lines = [
    "پاسخ جدید از نیلو ✨",
    "",
    "نتیجه: موافقه",
    `مدل برنامه: ${activityLine}`,
    `انتخاب اول: ${choiceLabel(1)}`,
    `انتخاب دوم: ${choiceLabel(2)}`,
    `انتخاب سوم: ${choiceLabel(3)}`,
    `شماره تماس: ${phone ? phone : "وارد نشده"}`,
    `یادداشت: ${response.note ? response.note : "—"}`,
    `زمان ثبت: ${submittedAt}`,
    `شناسه پاسخ: ${response.id}`,
  ];

  return { subject: "دعوت نیلو — پاسخ مثبت ✨", text: lines.join("\n") };
}
