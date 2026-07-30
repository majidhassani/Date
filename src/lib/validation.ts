import { z } from "zod";
import { LIMITS } from "./config";
import { normalizeIranMobile } from "./phone";

export const ACTIVITY_IDS = [
  "COFFEE_CHAT",
  "WALK_AND_COFFEE",
  "SPORTS",
  "BREAKFAST",
  "GALLERY",
  "SURPRISE",
  "CUSTOM",
] as const;

/** Remove control characters / null bytes, collapse whitespace, and trim. */
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return "";
  return input
    // Strip C0/C1 control chars except tab (\x09) and newline (\x0A).
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ نامعتبر است.");
const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت نامعتبر است.");

export const availabilityChoiceSchema = z.object({
  rank: z.number().int().min(1).max(LIMITS.maxAvailabilityChoices),
  localDate: localDateSchema,
  localTime: localTimeSchema,
});

const phoneRefinement = z
  .string()
  .trim()
  .max(30)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

// Shared shape for acceptance (used by both first submission and edit).
const acceptShape = {
  answer: z.literal("ACCEPTED"),
  activityType: z.enum(ACTIVITY_IDS, {
    errorMap: () => ({ message: "یک برنامه انتخاب کن." }),
  }),
  customActivity: z.string().max(LIMITS.customActivity).optional(),
  note: z.string().max(LIMITS.note).optional(),
  noClickCount: z.number().int().min(0).max(20).default(0),
  availability: z
    .array(availabilityChoiceSchema)
    .min(1, "حداقل یک زمان انتخاب کن.")
    .max(LIMITS.maxAvailabilityChoices),
  altTime: z.string().max(LIMITS.altTime).optional(),
  phone: phoneRefinement,
  phoneConsent: z.boolean().default(false),
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function refineAccept(data: any, ctx: z.RefinementCtx) {
  // Ranks must be unique and form a 1..n sequence.
  const ranks = data.availability
    .map((a: { rank: number }) => a.rank)
    .sort((a: number, b: number) => a - b);
  const expected = ranks.map((_: number, i: number) => i + 1);
  if (JSON.stringify(ranks) !== JSON.stringify(expected)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["availability"],
      message: "ترتیب انتخاب‌ها نامعتبر است.",
    });
  }

  // Phone: if provided it must be valid AND consented.
  if (data.phone) {
    if (!normalizeIranMobile(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "شماره موبایل درست به نظر نمی‌رسه. لطفاً با 09 شروعش کن.",
      });
    }
    if (!data.phoneConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneConsent"],
        message: "برای ثبت شماره، لطفاً رضایتت رو تأیید کن.",
      });
    }
  }
}

/** Acceptance submission (client → server). */
export const acceptSchema = z
  .object({ ...acceptShape, idempotencyKey: z.string().uuid() })
  .superRefine(refineAccept);

export type AcceptInput = z.infer<typeof acceptSchema>;

/** Definitive decline submission. */
export const declineSchema = z.object({
  answer: z.literal("DECLINED"),
  noClickCount: z.number().int().min(0).max(20).default(0),
  idempotencyKey: z.string().uuid(),
});

export type DeclineInput = z.infer<typeof declineSchema>;

/** Edit an existing response via a secure token (no idempotency key needed). */
export const editSchema = z.object({ ...acceptShape }).superRefine(refineAccept);

export type EditInput = z.infer<typeof editSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email("ایمیل نامعتبر است."),
  password: z.string().min(1, "رمز عبور را وارد کن."),
});

export const confirmPlanSchema = z.object({
  responseId: z.string().min(1),
  activity: z.string().min(1).max(120),
  localDate: localDateSchema,
  localTime: localTimeSchema,
  locationNote: z.string().max(LIMITS.locationNote).optional(),
});

export type ConfirmPlanInput = z.infer<typeof confirmPlanSchema>;
