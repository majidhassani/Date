"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import type { ActivityDef, ActivityId } from "@/lib/config";
import { LIMITS } from "@/lib/config";
import { toPersianDigits } from "@/lib/persian";
import { ActivityOptionCard } from "./activity-option-card";
import { StepFrame } from "./step-frame";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FlowData } from "./types";

export function ActivityStep({
  activities,
  activityType,
  customActivity,
  onChange,
  onNext,
  onBack,
  headingId,
}: {
  activities: ActivityDef[];
  activityType: ActivityId | null;
  customActivity: string;
  onChange: (patch: Partial<FlowData>) => void;
  onNext: () => void;
  onBack: () => void;
  headingId?: string;
}) {
  const selected = activities.find((a) => a.id === activityType);
  const showCustom = Boolean(selected?.hasCustomText);

  return (
    <StepFrame
      headingId={headingId}
      title="چه مدل برنامه‌ای بیشتر بهت می‌چسبه؟"
      description="یکی رو انتخاب کن؛ همیشه بعداً می‌تونیم هماهنگ‌ترش کنیم."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            <ChevronRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button
            className="ms-auto"
            onClick={onNext}
            disabled={!activityType}
          >
            ادامه
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">انتخاب مدل برنامه</legend>
        {activities.map((a) => (
          <label
            key={a.id}
            data-testid={`activity-label-${a.id}`}
            onClick={() => onChange({ activityType: a.id })}
            className="block cursor-pointer"
          >
            <input
              type="radio"
              name="activity"
              value={a.id}
              aria-label={a.title}
              checked={activityType === a.id}
              onChange={() => onChange({ activityType: a.id })}
              className="peer sr-only"
            />
            <div className="h-full rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
              <ActivityOptionCard activity={a} selected={activityType === a.id} />
            </div>
          </label>
        ))}
      </fieldset>

      {showCustom ? (
        <div className="mt-4 space-y-2">
          <Label htmlFor="customActivity">چه برنامه‌ای توی ذهنت هست؟</Label>
          <Textarea
            id="customActivity"
            value={customActivity}
            maxLength={LIMITS.customActivity}
            onChange={(e) =>
              onChange({ customActivity: e.target.value.slice(0, LIMITS.customActivity) })
            }
            placeholder="مثلاً: یه پیاده‌روی توی طبیعت و بعدش صبحانه"
          />
          <p className="text-start text-xs text-muted-foreground tnum">
            {toPersianDigits(customActivity.length)} /{" "}
            {toPersianDigits(LIMITS.customActivity)}
          </p>
        </div>
      ) : null}
    </StepFrame>
  );
}
