import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";

/**
 * Accessible multi-step progress indicator. The bar fills logically (RTL-aware
 * via flex direction), and a screen-reader-only sentence announces the step.
 */
export function StepProgress({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** 1-based current step. */
  current: number;
  className?: string;
}) {
  const total = steps.length;
  const clamped = Math.min(Math.max(current, 1), total);
  const currentLabel = steps[clamped - 1] ?? "";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span aria-hidden>{currentLabel}</span>
        <span aria-hidden className="tnum">
          {toPersianDigits(clamped)} / {toPersianDigits(total)}
        </span>
      </div>
      <ol className="flex gap-1.5" role="list">
        {steps.map((label, i) => {
          const state =
            i + 1 < clamped ? "done" : i + 1 === clamped ? "current" : "todo";
          return (
            <li key={label} className="h-1.5 flex-1" aria-hidden>
              <div
                className={cn(
                  "h-full w-full rounded-full transition-colors",
                  state === "done" && "bg-primary",
                  state === "current" && "bg-primary/60",
                  state === "todo" && "bg-muted",
                )}
              />
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        مرحله {toPersianDigits(clamped)} از {toPersianDigits(total)}: {currentLabel}
      </p>
    </div>
  );
}
