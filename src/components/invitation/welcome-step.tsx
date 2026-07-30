"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { AthleticVisual } from "@/components/athletic-visual";
import { Button } from "@/components/ui/button";

export function WelcomeStep({
  inviteeName,
  onStart,
  headingId,
}: {
  inviteeName: string;
  onStart: () => void;
  headingId?: string;
}) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.12 },
    },
  };
  const item = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-6 text-center"
    >
      <motion.div variants={item} className="w-full">
        <AthleticVisual />
      </motion.div>

      <motion.h1
        variants={item}
        id={headingId}
        tabIndex={-1}
        className="text-2xl font-extrabold tracking-tight outline-none sm:text-3xl"
      >
        سلام {inviteeName} 👋
      </motion.h1>

      <motion.p
        variants={item}
        className="max-w-md text-base leading-8 text-muted-foreground"
      >
        چون می‌دونم اهل ورزش و تجربه‌های باحالی، گفتم به‌جای یه پیام معمولی، یه دعوت
        متفاوت برات بسازم.
      </motion.p>

      <motion.p variants={item} className="text-base font-medium">
        آماده‌ای ببینی داستان چیه؟
      </motion.p>

      <motion.div variants={item}>
        <Button size="xl" onClick={onStart}>
          <Sparkles className="h-5 w-5" />
          شروع کنیم
        </Button>
      </motion.div>

      <motion.p
        variants={item}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Lock className="h-3.5 w-3.5" />
        این یه دعوت خصوصیه؛ فقط برای تو.
      </motion.p>
    </motion.div>
  );
}
