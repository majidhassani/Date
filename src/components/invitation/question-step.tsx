"use client";

import { AnimatedAnswerButtons } from "./animated-answer-buttons";

export function QuestionStep({
  inviteeName,
  onYes,
  onDecline,
  disabled,
  headingId,
}: {
  inviteeName: string;
  onYes: (noClickCount: number) => void;
  onDecline: (noClickCount: number) => void;
  disabled?: boolean;
  headingId?: string;
}) {
  return (
    <div className="space-y-8">
      <h2
        id={headingId}
        tabIndex={-1}
        className="text-center text-2xl font-bold outline-none sm:text-3xl"
      >
        {inviteeName}، پایه‌ای یه روز با هم بریم بیرون؟
      </h2>
      <div className="mx-auto max-w-sm">
        <AnimatedAnswerButtons
          onYes={onYes}
          onDecline={onDecline}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
