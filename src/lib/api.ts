import { generateRequestId } from "./tokens";

/** Stable, user-safe error codes returned by server actions / route handlers. */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "INVALID_TOKEN"
  | "ALREADY_RESPONDED"
  | "CONFLICT"
  | "SERVER_ERROR";

/** Localized (Persian) messages safe to show users. Never leak internals. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "اطلاعات وارد‌شده کامل یا درست نیست. لطفاً دوباره بررسی کن.",
  NOT_FOUND: "این دعوت پیدا نشد.",
  RATE_LIMITED: "کمی سریع پیش رفتی 🙂 چند لحظه صبر کن و دوباره امتحان کن.",
  UNAUTHORIZED: "دسترسی مجاز نیست.",
  INVALID_TOKEN: "این لینک ویرایش معتبر نیست یا منقضی شده.",
  ALREADY_RESPONDED: "پاسخ این دعوت قبلاً ثبت شده.",
  CONFLICT: "یه ناهماهنگی پیش اومد. لطفاً دوباره تلاش کن.",
  SERVER_ERROR: "یه مشکل غیرمنتظره پیش اومد. لطفاً کمی بعد دوباره تلاش کن.",
};

export type ApiError = {
  code: ErrorCode;
  message: string;
  requestId: string;
  /** Optional field-level validation issues. */
  fields?: Record<string, string>;
};

export type ActionResult<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: ApiError };

export function ok<T>(data: T, requestId = generateRequestId()): ActionResult<T> {
  return { success: true, data, requestId };
}

export function fail(
  code: ErrorCode,
  options?: { message?: string; fields?: Record<string, string>; requestId?: string },
): ActionResult<never> {
  return {
    success: false,
    error: {
      code,
      message: options?.message ?? ERROR_MESSAGES[code],
      requestId: options?.requestId ?? generateRequestId(),
      ...(options?.fields ? { fields: options.fields } : {}),
    },
  };
}
