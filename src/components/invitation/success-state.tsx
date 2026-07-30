"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, PencilLine } from "lucide-react";
import type { OwnerContact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { ContactCard } from "./contact-card";

export function SuccessState({
  inviteeName,
  owner,
  phoneShared,
  planSummary,
  editUrl,
}: {
  inviteeName: string;
  owner: OwnerContact;
  phoneShared: boolean;
  planSummary: string;
  editUrl?: string | null;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? undefined : { type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold" tabIndex={-1}>
          ثبت شد {inviteeName} ✨
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          انتخاب‌هات به {owner.name} رسید. برای هماهنگی می‌تونی مستقیم بهش پیام بدی.
        </p>
        {phoneShared ? (
          <p className="text-sm text-success">
            شماره‌ت هم با موفقیت برای {owner.name} فرستاده شد.
          </p>
        ) : null}
      </div>

      <div className="text-start">
        <ContactCard owner={owner} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <CopyButton
          value={planSummary}
          label="کپی خلاصه برنامه"
          toastMessage="خلاصه‌ی برنامه کپی شد."
        />
        {editUrl ? (
          <Button asChild variant="ghost">
            <Link href={editUrl}>
              <PencilLine className="h-4 w-4" />
              ویرایش انتخاب‌ها
            </Link>
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        مرسی که برای این دعوت متفاوت وقت گذاشتی 🌱
      </p>
    </div>
  );
}
