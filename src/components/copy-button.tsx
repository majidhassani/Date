"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn, copyText } from "@/lib/utils";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
  value: string;
  label?: string;
  toastMessage?: string;
};

/** Accessible copy-to-clipboard button with visual + toast confirmation. */
export function CopyButton({
  value,
  label = "کپی",
  toastMessage = "کپی شد.",
  variant = "outline",
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      toast.success(toastMessage);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("کپی نشد. لطفاً دستی کپی کن.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleCopy}
      className={cn(className)}
      aria-live="polite"
      {...props}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {children ?? label}
    </Button>
  );
}
