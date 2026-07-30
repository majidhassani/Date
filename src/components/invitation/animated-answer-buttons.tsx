"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/config";

// Index 0 is the initial label; 1..4 are the playful replies after each No click.
const NO_TEXTS = [
  "فعلاً نه 😄",
  "مطمئنی؟ 😄",
  "حتی یه قهوه کوچولو؟",
  "یه بار دیگه فکر کن ورزشکار!",
  "باشه، تصمیم سختیه 😅",
] as const;

const YES_TEXTS = [
  "آره، چرا که نه؟",
  "آره، می‌تونه باحال باشه",
  "باشه بابا، بریم 😄",
  "اوکی، برنامه رو بچین!",
] as const;

// Yes button grows (height + text) with each No click. No overlap: buttons are
// stacked in normal flow, so the No button always stays visible and clickable.
const YES_SIZE = [
  "h-12 text-base",
  "h-14 text-lg",
  "h-16 text-xl",
  "h-20 text-2xl",
] as const;

export function AnimatedAnswerButtons({
  onYes,
  onDecline,
  disabled = false,
}: {
  onYes: (noClickCount: number) => void;
  onDecline: (noClickCount: number) => void;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const [noClicks, setNoClicks] = React.useState(0);

  const step = Math.min(noClicks, YES_TEXTS.length - 1);
  const yesText = YES_TEXTS[step]!;
  const noText = NO_TEXTS[Math.min(noClicks, NO_TEXTS.length - 1)]!;
  const showDefinitive = noClicks >= 2;

  function handleNo() {
    setNoClicks((c) => Math.min(c + 1, LIMITS.maxNoClicks));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Yes — grows with each playful No click */}
      <motion.div
        layout={!reduce}
        transition={reduce ? undefined : { type: "spring", stiffness: 320, damping: 26 }}
      >
        <motion.button
          type="button"
          layout={!reduce}
          disabled={disabled}
          onClick={() => onYes(noClicks)}
          animate={reduce ? undefined : { scale: [1, 1.02, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          className={cn(
            "flex w-full items-center justify-center rounded-lg bg-primary px-6 font-bold text-primary-foreground shadow-md transition-colors",
            "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:pointer-events-none disabled:opacity-60",
            YES_SIZE[step],
          )}
        >
          {yesText}
        </motion.button>
      </motion.div>

      {/* No — never moves away, never hidden, always clickable */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleNo}
        className={cn(
          "flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-medium text-muted-foreground transition-colors",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-60",
        )}
      >
        {noText}
      </button>

      {/* Definitive, respectful decline — appears after the 2nd No click */}
      <div className="min-h-[2.75rem]">
        {showDefinitive ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDecline(noClicks)}
            className={cn(
              "mx-auto block rounded-md px-3 py-2 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            جدی می‌گم، فعلاً نمی‌خوام
          </button>
        ) : null}
      </div>

      {/* Screen-reader announcement of the changing labels/prominence */}
      <p className="sr-only" aria-live="polite">
        {`دکمه‌ی بله: ${yesText}. دکمه‌ی نه: ${noText}.`}
      </p>
    </div>
  );
}
