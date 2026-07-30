"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { isValidIranMobile } from "@/lib/phone";
import { StepFrame } from "./step-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { FlowData } from "./types";

export function PhoneConsentForm({
  phone,
  phoneConsent,
  onChange,
  onNext,
  onBack,
  headingId,
}: {
  phone: string;
  phoneConsent: boolean;
  onChange: (patch: Partial<FlowData>) => void;
  onNext: () => void;
  onBack: () => void;
  headingId?: string;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const hasPhone = phone.trim().length > 0;

  function proceed() {
    if (!hasPhone) {
      // Finishing without a phone number is completely fine.
      onChange({ phone: "", phoneConsent: false });
      onNext();
      return;
    }
    if (!isValidIranMobile(phone)) {
      setError("شماره موبایل درست به نظر نمی‌رسه. لطفاً با 09 شروعش کن.");
      return;
    }
    if (!phoneConsent) {
      setError("برای ثبت شماره، لطفاً تیک رضایت رو بزن.");
      return;
    }
    setError(null);
    onNext();
  }

  function skip() {
    onChange({ phone: "", phoneConsent: false });
    setError(null);
    onNext();
  }

  return (
    <StepFrame
      headingId={headingId}
      title="برای هماهنگی راحت‌تر، دوست داری شماره‌ت رو برای مجید بذاری؟"
      description="کاملاً اختیاریه. بدون شماره هم می‌تونی ادامه بدی."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            <ChevronRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button className="ms-auto" onClick={proceed}>
            ادامه
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">شماره موبایل</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="مثلاً 0912xxxxxxx"
            value={phone}
            maxLength={20}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby="phone-help phone-error"
            onChange={(e) => {
              onChange({ phone: e.target.value });
              if (error) setError(null);
            }}
          />
          <p id="phone-help" className="text-xs text-muted-foreground">
            اختیاریه؛ فقط برای هماهنگی همین دعوت استفاده می‌شه.
          </p>
          {error ? (
            <p id="phone-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <Checkbox
            checked={phoneConsent}
            onCheckedChange={(v) => onChange({ phoneConsent: v === true })}
            aria-describedby="consent-text"
            className="mt-0.5"
          />
          <span id="consent-text" className="text-sm leading-6">
            موافقم شماره‌م برای هماهنگی این دعوت در اختیار مجید قرار بگیره.
          </span>
        </label>

        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>
            شماره‌ت رمزنگاری‌شده ذخیره می‌شه و هر وقت بخوای قابل حذفه.
          </span>
        </div>

        <Button variant="ghost" onClick={skip} className="text-muted-foreground">
          رد کردن این مرحله
        </Button>
      </div>
    </StepFrame>
  );
}
