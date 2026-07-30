"use server";

import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/api";
import {
  acceptSchema,
  declineSchema,
  editSchema,
  sanitizeText,
} from "@/lib/validation";
import { encryptString } from "@/lib/crypto";
import { normalizeIranMobile } from "@/lib/phone";
import { localToUtc, TEHRAN_TZ } from "@/lib/datetime";
import { generateEditToken, generateRequestId, hashToken } from "@/lib/tokens";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { getOwnerContact } from "@/lib/owner";
import { logger } from "@/lib/logger";
import type {
  AcceptResultData,
  DeclineResultData,
  UpdateResultData,
} from "@/lib/types";

async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function combineNote(note?: string, altTime?: string): string | null {
  const parts = [
    sanitizeText(note),
    altTime ? `زمان پیشنهادی دیگر: ${sanitizeText(altTime)}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

// ---------------------------------------------------------------------------
// Accept
// ---------------------------------------------------------------------------

export async function submitAcceptance(
  slug: string,
  input: unknown,
): Promise<ActionResult<AcceptResultData>> {
  const requestId = generateRequestId();
  try {
    const rl = rateLimit(
      await clientKey(`submit:${slug}`),
      RATE_LIMITS.submit.limit,
      RATE_LIMITS.submit.windowMs,
    );
    if (!rl.ok) return fail("RATE_LIMITED", { requestId });

    const parsed = acceptSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", {
        requestId,
        fields: fieldErrors(parsed.error),
      });
    }
    const data = parsed.data;

    const invitation = await prisma.invitation.findUnique({ where: { slug } });
    if (!invitation || invitation.status === "CANCELLED") {
      return fail("NOT_FOUND", { requestId });
    }

    // Idempotency: a repeat submission with the same key returns the original.
    const existing = await prisma.response.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      return ok<AcceptResultData>(
        {
          responseId: existing.id,
          editToken: null,
          duplicate: true,
          owner: getOwnerContact(),
          phoneShared: Boolean(existing.phoneConsentAt),
        },
        requestId,
      );
    }

    // Encrypt phone only with explicit consent + valid number.
    let phoneEnc: string | null = null;
    let last4: string | null = null;
    let consentAt: Date | null = null;
    if (data.phone && data.phoneConsent) {
      const norm = normalizeIranMobile(data.phone);
      if (norm) {
        phoneEnc = encryptString(norm.e164);
        last4 = norm.last4;
        consentAt = new Date();
      }
    }

    const editToken = generateEditToken();
    const editTokenHash = hashToken(editToken);
    const customActivity = sanitizeText(data.customActivity) || null;
    const note = combineNote(data.note, data.altTime);

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        const response = await tx.response.create({
          data: {
            invitationId: invitation.id,
            answer: "ACCEPTED",
            activityType: data.activityType,
            customActivity,
            note,
            noClickCount: data.noClickCount,
            idempotencyKey: data.idempotencyKey,
            secureEditTokenHash: editTokenHash,
            inviteePhoneEncrypted: phoneEnc,
            inviteePhoneLast4: last4,
            phoneConsentAt: consentAt,
          },
        });

        await tx.availabilityChoice.createMany({
          data: data.availability.map((a) => ({
            responseId: response.id,
            rank: a.rank,
            localDate: a.localDate,
            localTime: a.localTime,
            timezone: TEHRAN_TZ,
            datetimeUtc: localToUtc(a.localDate, a.localTime),
          })),
        });

        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "RESPONDED" },
        });

        return response;
      });
    } catch (err) {
      // Concurrent duplicate on idempotencyKey — treat as idempotent success.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const dup = await prisma.response.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (dup) {
          return ok<AcceptResultData>(
            {
              responseId: dup.id,
              editToken: null,
              duplicate: true,
              owner: getOwnerContact(),
              phoneShared: Boolean(dup.phoneConsentAt),
            },
            requestId,
          );
        }
      }
      throw err;
    }

    // Notifications happen AFTER commit and can never lose the saved response.
    await dispatchNotifications(created.id);

    return ok<AcceptResultData>(
      {
        responseId: created.id,
        editToken,
        duplicate: false,
        owner: getOwnerContact(),
        phoneShared: Boolean(consentAt),
      },
      requestId,
    );
  } catch (err) {
    logger.error("submitAcceptance failed", { requestId, error: String(err) });
    return fail("SERVER_ERROR", { requestId });
  }
}

// ---------------------------------------------------------------------------
// Decline
// ---------------------------------------------------------------------------

export async function submitDecline(
  slug: string,
  input: unknown,
): Promise<ActionResult<DeclineResultData>> {
  const requestId = generateRequestId();
  try {
    const rl = rateLimit(
      await clientKey(`submit:${slug}`),
      RATE_LIMITS.submit.limit,
      RATE_LIMITS.submit.windowMs,
    );
    if (!rl.ok) return fail("RATE_LIMITED", { requestId });

    const parsed = declineSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", {
        requestId,
        fields: fieldErrors(parsed.error),
      });
    }
    const data = parsed.data;

    const invitation = await prisma.invitation.findUnique({ where: { slug } });
    if (!invitation || invitation.status === "CANCELLED") {
      return fail("NOT_FOUND", { requestId });
    }

    const existing = await prisma.response.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      return ok<DeclineResultData>({ responseId: existing.id }, requestId);
    }

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        const response = await tx.response.create({
          data: {
            invitationId: invitation.id,
            answer: "DECLINED",
            noClickCount: data.noClickCount,
            idempotencyKey: data.idempotencyKey,
          },
        });
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "RESPONDED" },
        });
        return response;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const dup = await prisma.response.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (dup) return ok<DeclineResultData>({ responseId: dup.id }, requestId);
      }
      throw err;
    }

    await dispatchNotifications(created.id);

    return ok<DeclineResultData>({ responseId: created.id }, requestId);
  } catch (err) {
    logger.error("submitDecline failed", { requestId, error: String(err) });
    return fail("SERVER_ERROR", { requestId });
  }
}

// ---------------------------------------------------------------------------
// Edit (via secure token)
// ---------------------------------------------------------------------------

export async function updateResponse(
  token: string,
  input: unknown,
): Promise<ActionResult<UpdateResultData>> {
  const requestId = generateRequestId();
  try {
    if (!token || token.length < 10) {
      return fail("INVALID_TOKEN", { requestId });
    }

    const rl = rateLimit(
      await clientKey("edit"),
      RATE_LIMITS.submit.limit,
      RATE_LIMITS.submit.windowMs,
    );
    if (!rl.ok) return fail("RATE_LIMITED", { requestId });

    const parsed = editSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", {
        requestId,
        fields: fieldErrors(parsed.error),
      });
    }
    const data = parsed.data;

    const tokenHash = hashToken(token);
    const response = await prisma.response.findFirst({
      where: { secureEditTokenHash: tokenHash, answer: "ACCEPTED" },
    });
    if (!response) return fail("INVALID_TOKEN", { requestId });

    const customActivity = sanitizeText(data.customActivity) || null;
    const note = combineNote(data.note, data.altTime);

    // Phone on edit: update only when a (valid, consented) number is supplied;
    // an empty phone field leaves any previously stored number untouched.
    let phoneUpdate: Prisma.ResponseUpdateInput = {};
    if (data.phone && data.phoneConsent) {
      const norm = normalizeIranMobile(data.phone);
      if (norm) {
        phoneUpdate = {
          inviteePhoneEncrypted: encryptString(norm.e164),
          inviteePhoneLast4: norm.last4,
          phoneConsentAt: new Date(),
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.response.update({
        where: { id: response.id },
        data: {
          activityType: data.activityType,
          customActivity,
          note,
          ...phoneUpdate,
        },
      });
      await tx.availabilityChoice.deleteMany({
        where: { responseId: response.id },
      });
      await tx.availabilityChoice.createMany({
        data: data.availability.map((a) => ({
          responseId: response.id,
          rank: a.rank,
          localDate: a.localDate,
          localTime: a.localTime,
          timezone: TEHRAN_TZ,
          datetimeUtc: localToUtc(a.localDate, a.localTime),
        })),
      });
    });

    const fresh = await prisma.response.findUnique({
      where: { id: response.id },
    });

    return ok<UpdateResultData>(
      {
        responseId: response.id,
        owner: getOwnerContact(),
        phoneShared: Boolean(fresh?.phoneConsentAt),
      },
      requestId,
    );
  } catch (err) {
    logger.error("updateResponse failed", { requestId, error: String(err) });
    return fail("SERVER_ERROR", { requestId });
  }
}
