"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { PublicInvitationConfig } from "@/lib/invitation-config";
import type { OwnerContact } from "@/lib/types";
import { APP_URL } from "@/lib/env";
import { safeRandomId } from "@/lib/utils";
import {
  submitAcceptance,
  submitDecline,
  updateResponse,
} from "@/server/actions/invitation";
import { StepProgress } from "@/components/step-progress";
import { WelcomeStep } from "./welcome-step";
import { QuestionStep } from "./question-step";
import { ActivityStep } from "./activity-step";
import { DateTimeStep } from "./datetime-step";
import { PhoneConsentForm } from "./phone-consent-form";
import { ReviewSummary } from "./review-summary";
import { SuccessState } from "./success-state";
import { DeclineState } from "./decline-state";
import { buildPlanSummary } from "./summary";
import { emptyFlowData, type FlowData } from "./types";

type Step =
  | "welcome"
  | "question"
  | "activity"
  | "datetime"
  | "phone"
  | "review"
  | "success"
  | "declined";

const HEADING_ID = "flow-heading";
const PROGRESS_STEPS = ["برنامه", "زمان", "شماره", "مرور"];
const PROGRESS_INDEX: Partial<Record<Step, number>> = {
  activity: 1,
  datetime: 2,
  phone: 3,
  review: 4,
};

type SuccessInfo = {
  owner: OwnerContact;
  phoneShared: boolean;
  editUrl: string | null;
};

export function InvitationExperience({
  slug,
  config,
  editContext,
}: {
  slug: string;
  config: PublicInvitationConfig;
  editContext?: { token: string; initial: FlowData };
}) {
  const reduce = useReducedMotion();
  const isEdit = Boolean(editContext);

  const [step, setStep] = React.useState<Step>(isEdit ? "activity" : "welcome");
  const [data, setData] = React.useState<FlowData>(
    editContext?.initial ?? emptyFlowData,
  );
  const [noClickCount, setNoClickCount] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<SuccessInfo | null>(null);

  const firstRender = React.useRef(true);

  // Stable idempotency key per browser/slug — protects against double submits.
  const [idempotencyKey] = React.useState<string>(() => {
    if (typeof window === "undefined") return safeRandomId();
    try {
      const storageKey = `nilou:idemp:${slug}`;
      const existing = window.localStorage.getItem(storageKey);
      if (existing) return existing;
      const value = safeRandomId();
      window.localStorage.setItem(storageKey, value);
      return value;
    } catch {
      // localStorage can be unavailable (private mode); still return an id.
      return safeRandomId();
    }
  });

  // Focus the step heading after each transition (skip the very first render).
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      document.getElementById(HEADING_ID)?.focus();
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [step, reduce]);

  const patch = React.useCallback(
    (p: Partial<FlowData>) => setData((d) => ({ ...d, ...p })),
    [],
  );

  function handleYes(clicks: number) {
    setNoClickCount(clicks);
    setStep("activity");
  }

  async function handleDecline(clicks: number) {
    setNoClickCount(clicks);
    setSubmitting(true);
    try {
      const res = await submitDecline(slug, {
        answer: "DECLINED",
        noClickCount: clicks,
        idempotencyKey,
      });
      if (!res.success) {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("ثبت پاسخ با خطا مواجه شد.");
    } finally {
      // Respect her choice in the UI regardless of the network outcome.
      setSubmitting(false);
      setStep("declined");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload = {
      answer: "ACCEPTED" as const,
      activityType: data.activityType ?? undefined,
      customActivity: data.customActivity || undefined,
      note: data.note || undefined,
      noClickCount,
      availability: data.availability.map((a, i) => ({
        rank: i + 1,
        localDate: a.localDate,
        localTime: a.localTime,
      })),
      altTime: data.altTime || undefined,
      phone: data.phone || undefined,
      phoneConsent: data.phoneConsent,
      idempotencyKey,
    };

    try {
      if (editContext) {
        const res = await updateResponse(editContext.token, payload);
        if (res.success) {
          setSuccess({
            owner: res.data.owner,
            phoneShared: res.data.phoneShared,
            editUrl: `${APP_URL}/invite/${slug}/edit/${editContext.token}`,
          });
          setStep("success");
        } else {
          setError(res.error.message);
        }
      } else {
        const res = await submitAcceptance(slug, payload);
        if (res.success) {
          setSuccess({
            owner: res.data.owner,
            phoneShared: res.data.phoneShared,
            editUrl: res.data.editToken
              ? `${APP_URL}/invite/${slug}/edit/${res.data.editToken}`
              : null,
          });
          setStep("success");
        } else {
          setError(res.error.message);
        }
      }
    } catch {
      setError("ارسال با خطا مواجه شد. اطلاعاتت حفظ شده — دوباره تلاش کن.");
    } finally {
      setSubmitting(false);
    }
  }

  const progressCurrent = PROGRESS_INDEX[step];

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const variants = reduce
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <div>
      {progressCurrent ? (
        <div className="mb-8">
          <StepProgress steps={PROGRESS_STEPS} current={progressCurrent} />
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          {step === "welcome" ? (
            <WelcomeStep
              inviteeName={config.inviteeName}
              onStart={() => setStep("question")}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "question" ? (
            <QuestionStep
              inviteeName={config.inviteeName}
              onYes={handleYes}
              onDecline={handleDecline}
              disabled={submitting}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "activity" ? (
            <ActivityStep
              activities={config.activities}
              activityType={data.activityType}
              customActivity={data.customActivity}
              onChange={patch}
              onNext={() => setStep("datetime")}
              onBack={() => setStep(isEdit ? "activity" : "question")}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "datetime" ? (
            <DateTimeStep
              dateOptions={config.dateOptions}
              timeSlots={config.timeSlots}
              availability={data.availability}
              altTime={data.altTime}
              onChange={patch}
              onNext={() => setStep("phone")}
              onBack={() => setStep("activity")}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "phone" ? (
            <PhoneConsentForm
              phone={data.phone}
              phoneConsent={data.phoneConsent}
              onChange={patch}
              onNext={() => setStep("review")}
              onBack={() => setStep("datetime")}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "review" ? (
            <ReviewSummary
              data={data}
              activities={config.activities}
              submitting={submitting}
              error={error}
              submitLabel={isEdit ? "ثبت تغییرات ✨" : "همینه، بفرست برای مجید ✨"}
              onSubmit={handleSubmit}
              onBack={() => setStep("phone")}
              headingId={HEADING_ID}
            />
          ) : null}

          {step === "success" && success ? (
            <SuccessState
              inviteeName={config.inviteeName}
              owner={success.owner}
              phoneShared={success.phoneShared}
              planSummary={buildPlanSummary(data, config.activities)}
              editUrl={success.editUrl}
            />
          ) : null}

          {step === "declined" ? <DeclineState /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
