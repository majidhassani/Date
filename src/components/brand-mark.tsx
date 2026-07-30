import { cn } from "@/lib/utils";

/** Compact athletic emblem used in the header/footer. Decorative. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("h-8 w-8", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" className="fill-primary/12" />
      <circle
        cx="16"
        cy="16"
        r="9"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="18 8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3.5" className="fill-accent" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="text-base font-extrabold tracking-tight">دعوت</span>
    </span>
  );
}
