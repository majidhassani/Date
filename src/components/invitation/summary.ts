import type { ActivityDef } from "@/lib/config";
import { formatLocalDateTimeLabel } from "@/lib/datetime";
import { RANK_LABELS, type FlowData } from "./types";

/** Human-readable Persian plan summary for the "copy plan" action. */
export function buildPlanSummary(
  data: FlowData,
  activities: ActivityDef[],
): string {
  const activity = activities.find((a) => a.id === data.activityType);
  const lines: string[] = ["خلاصه‌ی برنامه ✨"];

  lines.push(
    `مدل برنامه: ${activity?.title ?? "—"}${
      data.customActivity ? ` — ${data.customActivity}` : ""
    }`,
  );

  data.availability.forEach((item, i) => {
    lines.push(
      `${RANK_LABELS[i] ?? `انتخاب ${i + 1}`}: ${formatLocalDateTimeLabel(
        item.localDate,
        item.localTime,
      )}`,
    );
  });

  if (data.altTime) lines.push(`زمان دیگر: ${data.altTime}`);
  if (data.note) lines.push(`یادداشت: ${data.note}`);

  return lines.join("\n");
}
