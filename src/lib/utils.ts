import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sleep helper (used by retry/backoff utilities). */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp a number to a range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
