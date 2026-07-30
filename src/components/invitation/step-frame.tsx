import * as React from "react";
import { cn } from "@/lib/utils";

/** Consistent layout for a single step: focusable heading, body, footer nav. */
export function StepFrame({
  title,
  description,
  headingId,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  headingId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-1.5">
        <h2
          id={headingId}
          tabIndex={-1}
          className="text-xl font-bold tracking-tight outline-none sm:text-2xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div>{children}</div>
      {footer ? (
        <div className="flex items-center gap-3 pt-1">{footer}</div>
      ) : null}
    </div>
  );
}
