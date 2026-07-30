"use client";

import { CalendarDays, Check } from "lucide-react";
import type { DateOption } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** Presentational date option. Interactivity is provided by a wrapping label. */
export function DateChoiceCard({
  option,
  selected,
}: {
  option: DateOption;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full items-center gap-3 rounded-xl border bg-surface p-3.5 shadow-sm transition-all",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <CalendarDays className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{option.tag}</div>
        <div className="font-semibold leading-tight">
          {option.info.jalaliWithWeekday}
        </div>
      </div>
      {selected ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : null}
    </div>
  );
}
