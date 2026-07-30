"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import { formatLocalDateTimeLabel } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RANK_LABELS, type AvailabilityItem } from "./types";

/** Ranked list of chosen date/times with keyboard-accessible reordering. */
export function RankedAvailabilityList({
  items,
  onRemove,
  onMove,
}: {
  items: AvailabilityItem[];
  onRemove: (index: number) => void;
  onMove: (index: number, dir: "up" | "down") => void;
}) {
  if (items.length === 0) return null;

  return (
    <ol className="space-y-2" aria-label="زمان‌های انتخاب‌شده">
      {items.map((item, index) => (
        <li
          key={`${item.localDate}-${item.localTime}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm"
        >
          <Badge variant="default" className="shrink-0">
            {RANK_LABELS[index] ?? `انتخاب ${index + 1}`}
          </Badge>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {formatLocalDateTimeLabel(item.localDate, item.localTime)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(index, "up")}
              disabled={index === 0}
              aria-label="انتقال به بالا"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent",
              )}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, "down")}
              disabled={index === items.length - 1}
              aria-label="انتقال به پایین"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent",
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="حذف این زمان"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
