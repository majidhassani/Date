"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { DateOption } from "@/lib/datetime";
import { LIMITS } from "@/lib/config";
import { toPersianDigits } from "@/lib/persian";
import { StepFrame } from "./step-frame";
import { DateChoiceCard } from "./date-choice-card";
import { TimeSlotPicker } from "./time-slot-picker";
import { PersianDatePicker } from "./persian-date-picker";
import { RankedAvailabilityList } from "./ranked-availability-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AvailabilityItem, FlowData } from "./types";

export function DateTimeStep({
  dateOptions,
  timeSlots,
  availability,
  altTime,
  onChange,
  onNext,
  onBack,
  headingId,
}: {
  dateOptions: { quick: DateOption[]; weekdays: DateOption[] };
  timeSlots: string[];
  availability: AvailabilityItem[];
  altTime: string;
  onChange: (patch: Partial<FlowData>) => void;
  onNext: () => void;
  onBack: () => void;
  headingId?: string;
}) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const [showPicker, setShowPicker] = React.useState(false);

  const full = availability.length >= LIMITS.maxAvailabilityChoices;

  const allDateCards = [...dateOptions.quick, ...dateOptions.weekdays];

  function add() {
    if (!selectedDate || !selectedTime) {
      setError("اول یه روز و یه ساعت انتخاب کن.");
      return;
    }
    if (full) {
      setError("حداکثر سه زمان می‌تونی انتخاب کنی.");
      return;
    }
    if (
      availability.some(
        (i) => i.localDate === selectedDate && i.localTime === selectedTime,
      )
    ) {
      setError("این زمان قبلاً اضافه شده.");
      return;
    }
    onChange({
      availability: [
        ...availability,
        { localDate: selectedDate, localTime: selectedTime },
      ],
    });
    setSelectedTime(null);
    setError(null);
    setAnnounce("زمان به فهرست انتخاب‌ها اضافه شد.");
  }

  function remove(index: number) {
    onChange({ availability: availability.filter((_, i) => i !== index) });
    setAnnounce("زمان حذف شد.");
  }

  function move(index: number, dir: "up" | "down") {
    const next = [...availability];
    const target = index + (dir === "up" ? -1 : 1);
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange({ availability: next });
  }

  return (
    <StepFrame
      headingId={headingId}
      title="چه روز و ساعتی برات بهتره؟"
      description="تا سه تا زمان می‌تونی انتخاب کنی و به‌ترتیب اولویت مرتب‌شون کنی."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            <ChevronRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button
            className="ms-auto"
            onClick={onNext}
            disabled={availability.length === 0}
          >
            ادامه
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Date selection */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">یه روز انتخاب کن</legend>

          <p className="text-xs text-muted-foreground">دم‌دستی‌ها</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {dateOptions.quick.map((opt, i) => (
              <label key={opt.localDate} className="block cursor-pointer">
                <input
                  type="radio"
                  name="date"
                  aria-label={`${opt.tag}، ${opt.info.jalaliWithWeekday}`}
                  data-testid={`date-quick-${i}`}
                  checked={selectedDate === opt.localDate}
                  onChange={() => {
                    setSelectedDate(opt.localDate);
                    setShowPicker(false);
                  }}
                  className="peer sr-only"
                />
                <div className="rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                  <DateChoiceCard option={opt} selected={selectedDate === opt.localDate} />
                </div>
              </label>
            ))}
          </div>

          {dateOptions.weekdays.length > 0 ? (
            <>
              <p className="pt-1 text-xs text-muted-foreground">آخر هفته‌ی نزدیک</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {dateOptions.weekdays.map((opt, i) => (
                  <label key={opt.localDate} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="date"
                      aria-label={`${opt.tag}، ${opt.info.jalaliWithWeekday}`}
                      data-testid={`date-weekday-${i}`}
                      checked={selectedDate === opt.localDate}
                      onChange={() => {
                        setSelectedDate(opt.localDate);
                        setShowPicker(false);
                      }}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                      <DateChoiceCard
                        option={opt}
                        selected={selectedDate === opt.localDate}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : null}

          <div className="pt-1">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => setShowPicker((s) => !s)}
              aria-expanded={showPicker}
            >
              {showPicker ? "بستن تقویم" : "یا یه تاریخ دیگه از تقویم انتخاب کن"}
            </Button>
            {showPicker ? (
              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                <PersianDatePicker
                  value={
                    selectedDate &&
                    !allDateCards.some((c) => c.localDate === selectedDate)
                      ? selectedDate
                      : null
                  }
                  onChange={(d) => setSelectedDate(d)}
                />
              </div>
            ) : null}
          </div>
        </fieldset>

        {/* Time selection */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">یه ساعت انتخاب کن</p>
          <TimeSlotPicker slots={timeSlots} value={selectedTime} onChange={setSelectedTime} />
        </div>

        <div>
          <Button
            type="button"
            variant="accent"
            onClick={add}
            disabled={full || !selectedDate || !selectedTime}
          >
            <Plus className="h-4 w-4" />
            افزودن به انتخاب‌ها
          </Button>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {/* Ranked list */}
        {availability.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              انتخاب‌های تو{" "}
              <span className="text-muted-foreground tnum">
                ({toPersianDigits(availability.length)} از{" "}
                {toPersianDigits(LIMITS.maxAvailabilityChoices)})
              </span>
            </p>
            <RankedAvailabilityList
              items={availability}
              onRemove={remove}
              onMove={move}
            />
          </div>
        ) : null}

        {/* Optional alternate time */}
        <div className="space-y-2">
          <Label htmlFor="altTime">اگه زمان دیگه‌ای برات بهتره، اینجا بنویس</Label>
          <Textarea
            id="altTime"
            value={altTime}
            maxLength={LIMITS.altTime}
            onChange={(e) => onChange({ altTime: e.target.value.slice(0, LIMITS.altTime) })}
            placeholder="مثلاً: عصرهای وسط هفته معمولاً بهترم"
            className="min-h-16"
          />
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </StepFrame>
  );
}
