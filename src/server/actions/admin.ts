"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/api";
import {
  adminLoginSchema,
  confirmPlanSchema,
  sanitizeText,
} from "@/lib/validation";
import {
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
  verifyAdminCredentials,
  type AdminSession,
} from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { decryptString } from "@/lib/crypto";
import { e164ToLocal, formatLocalGrouped } from "@/lib/phone";
import { localToUtc, formatUtcAsJalali, TEHRAN_TZ } from "@/lib/datetime";
import { retryNotification } from "@/lib/notifications/dispatch";
import { sendTelegram } from "@/lib/notifications/telegram";
import { isTelegramConfigured } from "@/lib/env";
import { generateRequestId } from "@/lib/tokens";
import { logger } from "@/lib/logger";
import type { PhoneReveal } from "@/lib/types";

async function requireAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}

async function audit(
  session: AdminSession,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminIdentifier: session.email,
        action,
        entityType,
        entityId,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch (err) {
    logger.error("audit write failed", { action, error: String(err) });
  }
}

async function loginKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `admin-login:${ip}`;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function adminLogin(
  input: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const requestId = generateRequestId();
  const rl = rateLimit(
    await loginKey(),
    RATE_LIMITS.adminLogin.limit,
    RATE_LIMITS.adminLogin.windowMs,
  );
  if (!rl.ok) return fail("RATE_LIMITED", { requestId });

  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", { requestId });
  }

  const valid = await verifyAdminCredentials(
    parsed.data.email,
    parsed.data.password,
  );
  if (!valid) {
    return fail("UNAUTHORIZED", {
      requestId,
      message: "ایمیل یا رمز عبور درست نیست.",
    });
  }

  await createAdminSession(parsed.data.email);
  return ok({ ok: true }, requestId);
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Phone reveal / delete
// ---------------------------------------------------------------------------

export async function revealPhone(
  responseId: string,
): Promise<ActionResult<PhoneReveal>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  const rl = rateLimit(
    `phone-reveal:${session.email}`,
    RATE_LIMITS.phoneReveal.limit,
    RATE_LIMITS.phoneReveal.windowMs,
  );
  if (!rl.ok) return fail("RATE_LIMITED", { requestId });

  const response = await prisma.response.findUnique({
    where: { id: responseId },
    select: { inviteePhoneEncrypted: true, phoneConsentAt: true },
  });
  if (!response?.inviteePhoneEncrypted || !response.phoneConsentAt) {
    return fail("NOT_FOUND", { requestId, message: "شماره‌ای ثبت نشده." });
  }

  let e164: string;
  try {
    e164 = decryptString(response.inviteePhoneEncrypted);
  } catch {
    return fail("SERVER_ERROR", {
      requestId,
      message: "امکان رمزگشایی شماره نیست (کلید تغییر کرده؟).",
    });
  }

  const local = e164ToLocal(e164);
  const waNumber = e164.replace("+", "");

  await audit(session, "PHONE_REVEAL", "Response", responseId);

  return ok<PhoneReveal>(
    {
      e164,
      local,
      display: formatLocalGrouped(local),
      telHref: `tel:${e164}`,
      smsHref: `sms:${e164}`,
      whatsappHref: `https://wa.me/${waNumber}`,
    },
    requestId,
  );
}

export async function deletePhone(
  responseId: string,
): Promise<ActionResult<{ ok: true }>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  await prisma.response.update({
    where: { id: responseId },
    data: {
      inviteePhoneEncrypted: null,
      inviteePhoneLast4: null,
      phoneConsentAt: null,
    },
  });

  await audit(session, "PHONE_DELETE", "Response", responseId);
  revalidatePath(`/admin/responses/${responseId}`);
  revalidatePath("/admin");
  return ok({ ok: true }, requestId);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function retryNotificationAction(
  attemptId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  const attempt = await prisma.notificationAttempt.findUnique({
    where: { id: attemptId },
    select: { responseId: true },
  });
  if (!attempt) return fail("NOT_FOUND", { requestId });

  const result = await retryNotification(attemptId);
  await audit(session, "NOTIFY_RETRY", "NotificationAttempt", attemptId, {
    ok: result.ok,
  });

  revalidatePath(`/admin/responses/${attempt.responseId}`);
  return ok({ ok: result.ok }, requestId);
}

// ---------------------------------------------------------------------------
// Final plan
// ---------------------------------------------------------------------------

export async function confirmFinalPlan(
  input: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  const parsed = confirmPlanSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", { requestId });
  }
  const data = parsed.data;

  const response = await prisma.response.findUnique({
    where: { id: data.responseId },
    include: { invitation: true },
  });
  if (!response) return fail("NOT_FOUND", { requestId });

  const finalDatetimeUtc = localToUtc(data.localDate, data.localTime);
  const locationNote = sanitizeText(data.locationNote) || null;

  await prisma.$transaction(async (tx) => {
    await tx.finalPlan.upsert({
      where: { responseId: data.responseId },
      update: {
        activity: sanitizeText(data.activity),
        finalDatetimeUtc,
        timezone: TEHRAN_TZ,
        locationNote,
      },
      create: {
        responseId: data.responseId,
        activity: sanitizeText(data.activity),
        finalDatetimeUtc,
        timezone: TEHRAN_TZ,
        locationNote,
      },
    });
    await tx.invitation.update({
      where: { id: response.invitationId },
      data: { status: "CONFIRMED" },
    });
  });

  await audit(session, "FINAL_PLAN_CONFIRM", "Response", data.responseId);

  // Best-effort confirmation notification (never blocks the action).
  if (isTelegramConfigured) {
    try {
      const when = formatUtcAsJalali(finalDatetimeUtc).full;
      await sendTelegram(
        `قرار نهایی ثبت شد ✅\nبرنامه: ${sanitizeText(data.activity)}\nزمان: ${when}${
          locationNote ? `\nمکان: ${locationNote}` : ""
        }`,
      );
    } catch (err) {
      logger.warn("final plan confirmation notify failed", {
        error: String(err),
      });
    }
  }

  revalidatePath(`/admin/responses/${data.responseId}`);
  revalidatePath("/admin");
  return ok({ ok: true }, requestId);
}

export async function markCompleted(
  responseId: string,
): Promise<ActionResult<{ ok: true }>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  const response = await prisma.response.findUnique({
    where: { id: responseId },
    select: { invitationId: true },
  });
  if (!response) return fail("NOT_FOUND", { requestId });

  await prisma.invitation.update({
    where: { id: response.invitationId },
    data: { status: "COMPLETED" },
  });

  await audit(session, "MARK_COMPLETED", "Response", responseId);
  revalidatePath(`/admin/responses/${responseId}`);
  revalidatePath("/admin");
  return ok({ ok: true }, requestId);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const exportSchema = z.object({
  responseId: z.string().min(1),
  includePhone: z.boolean().default(false),
});

export async function exportResponse(
  input: unknown,
): Promise<ActionResult<{ filename: string; json: string }>> {
  const requestId = generateRequestId();
  const session = await requireAdmin();
  if (!session) return fail("UNAUTHORIZED", { requestId });

  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION_ERROR", { requestId });

  const response = await prisma.response.findUnique({
    where: { id: parsed.data.responseId },
    include: {
      availabilityChoices: { orderBy: { rank: "asc" } },
      finalPlan: true,
      invitation: { select: { slug: true, inviteeName: true } },
    },
  });
  if (!response) return fail("NOT_FOUND", { requestId });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inviteePhoneEncrypted, secureEditTokenHash, ...safe } = response;

  let phone: string | undefined;
  if (parsed.data.includePhone && response.inviteePhoneEncrypted) {
    try {
      phone = decryptString(response.inviteePhoneEncrypted);
      await audit(session, "PHONE_EXPORT", "Response", response.id);
    } catch {
      phone = undefined;
    }
  }

  const payload = {
    ...safe,
    phone: parsed.data.includePhone ? (phone ?? null) : undefined,
  };

  return ok(
    {
      filename: `response-${response.id}.json`,
      json: JSON.stringify(payload, null, 2),
    },
    requestId,
  );
}
