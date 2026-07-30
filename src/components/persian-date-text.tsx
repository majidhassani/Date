import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/persian";

/** Renders any value with Latin digits converted to Persian digits. */
export function PersianDateText({
  children,
  className,
}: {
  children: string | number;
  className?: string;
}) {
  return <span className={cn("tnum", className)}>{toPersianDigits(children)}</span>;
}
