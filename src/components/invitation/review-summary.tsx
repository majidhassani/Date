"use client";

import { Loader2, PencilLine, Send, ShieldCheck } from "lucide-react";
import type { ActivityDef } from "@/lib/config";
import { formatLocalDateTimeLabel } from "@/lib/datetime";
import { normalizeIranMobile } from "@/lib/phone";
import { toPersianDigits } from "@/lib/persian";
import { StepFrame } from "./step-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RANK_LABELS, type FlowData } from "./types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-32 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

function maskLocal(local: string): string {
  return `${toPersianDigits(local.slice(0, 4))} *** ${toPersianDigits(local.slice(-4))}`;
}

export function ReviewSummary({
  data,
  activities,
  submitting,
  error,
  submitLabel = "همینه، بفرست برای مجید ✨",
  onSubmit,
  onBack,
  headingId,
}: {
  data: FlowData;
  activities: ActivityDef[];
  submitting: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: () => void;
  onBack: () => void;
  headingId?: string;
}) {
  const activity = activities.find((a) => a.id === data.activityType);
  const norm = data.phone ? normalizeIranMobile(data.phone) : null;
  const phoneShared = Boolean(norm && data.phoneConsent);

  return (
    <StepFrame
      headingId={headingId}
      title="یه نگاه آخر بنداز 👀"
      description="اگه همه‌چی درسته، بفرستش."
      footer={
        <>
          <Button variant="ghost" onClick={onBack} disabled={submitting}>
            <PencilLine className="h-4 w-4" />
            ویرایش انتخاب‌ها
          </Button>
          <Button className="ms-auto" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "در حال ارسال…" : submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <dl>
              <Row label="مدل برنامه">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{activity?.title ?? "—"}</span>
                  {activity?.energy ? (
                    <Badge variant="muted">{activity.energy}</Badge>
                  ) : null}
                </div>
                {data.customActivity ? (
                  <p className="mt-1 text-muted-foreground">{data.customActivity}</p>
                ) : null}
              </Row>

              <Row label="زمان‌ها">
                {data.availability.length > 0 ? (
                  <ol className="space-y-1.5">
                    {data.availability.map((item, i) => (
                      <li
                        key={`${item.localDate}-${item.localTime}`}
                        className="flex items-center gap-2"
                      >
                        <Badge variant="default">
                          {RANK_LABELS[i] ?? `انتخاب ${i + 1}`}
                        </Badge>
                        <span>
                          {formatLocalDateTimeLabel(item.localDate, item.localTime)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  "—"
                )}
              </Row>

              {data.altTime ? (
                <Row label="زمان دیگر">{data.altTime}</Row>
              ) : null}

              {data.note ? <Row label="یادداشت">{data.note}</Row> : null}

              <Row label="شماره تماس">
                {phoneShared && norm ? (
                  <span className="tnum" dir="ltr">
                    {maskLocal(norm.local)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">فرستاده نمی‌شه</span>
                )}
              </Row>
            </dl>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>با ثبت این انتخاب‌ها، فقط اطلاعات همین دعوت برای مجید ارسال می‌شه.</span>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </StepFrame>
  );
}
