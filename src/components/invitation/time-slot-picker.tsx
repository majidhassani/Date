"use client";

import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

/** Single-select time slots as an accessible group of toggle buttons. */
export function TimeSlotPicker({
  slots,
  value,
  onChange,
  label = "ساعت",
}: {
  slots: string[];
  value: string | null;
  onChange: (slot: string) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const active = value === slot;
        return (
          <button
            key={slot}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(slot)}
            className={cn(
              "flex h-11 min-w-[4.75rem] items-center justify-center rounded-lg border px-4 text-sm font-semibold tnum transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:bg-muted",
            )}
          >
            {toPersianDigits(slot)}
          </button>
        );
      })}
    </div>
  );
}
