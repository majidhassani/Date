"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sprout } from "lucide-react";

/** Respectful, calm decline screen. No persuasion, no contact details. */
export function DeclineState() {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <motion.div
        initial={reduce ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? undefined : { type: "spring", stiffness: 220, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <Sprout className="h-8 w-8" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold" tabIndex={-1}>
          کاملاً قابل احترامه 🌱
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          مرسی که صادقانه جواب دادی.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          امیدوارم همیشه پرانرژی و خوشحال باشی.
        </p>
      </div>
    </div>
  );
}
