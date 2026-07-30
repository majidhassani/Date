import "server-only";
import type { NotificationChannel } from "@prisma/client";
import { prisma } from "../db";
import { decryptString } from "../crypto";
import { isEmailConfigured, isTelegramConfigured } from "../env";
import { logger } from "../logger";
import { buildOwnerMessage } from "./messages";
import { sendTelegram } from "./telegram";
import { sendEmail } from "./email";

/** Strip anything phone-like from an error string before it is persisted. */
function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/(\+?\d[\d\s-]{7,}\d)/g, "«شماره»").slice(0, 500);
}

async function loadMessageForResponse(responseId: string) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { availabilityChoices: { orderBy: { rank: "asc" } } },
  });
  if (!response) return null;

  // Decrypt phone only when consent is present. Never log the result.
  let phone: string | null = null;
  if (response.inviteePhoneEncrypted && response.phoneConsentAt) {
    try {
      phone = decryptString(response.inviteePhoneEncrypted);
    } catch (err) {
      logger.warn("Could not decrypt phone for notification (key mismatch?)", {
        responseId,
        err: sanitizeError(err),
      });
    }
  }

  return { response, message: buildOwnerMessage(response, phone) };
}

async function runChannel(
  attemptId: string,
  channel: NotificationChannel,
  send: () => Promise<void>,
): Promise<boolean> {
  try {
    await send();
    await prisma.notificationAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        attemptCount: { increment: 1 },
        errorMessage: null,
      },
    });
    logger.info("Notification sent", { channel, attemptId });
    return true;
  } catch (err) {
    const message = sanitizeError(err);
    await prisma.notificationAttempt.update({
      where: { id: attemptId },
      data: {
        status: "FAILED",
        attemptCount: { increment: 1 },
        errorMessage: message,
      },
    });
    logger.error("Notification failed", { channel, attemptId, error: message });
    return false;
  }
}

/**
 * Fire notifications for a freshly-saved response. Never throws — the response
 * is already committed; notification outcomes are recorded for later retry.
 */
export async function dispatchNotifications(
  responseId: string,
): Promise<{ attempted: number; sent: number }> {
  let attempted = 0;
  let sent = 0;

  try {
    const loaded = await loadMessageForResponse(responseId);
    if (!loaded) return { attempted, sent };
    const { message } = loaded;

    if (isTelegramConfigured) {
      const attempt = await prisma.notificationAttempt.create({
        data: { responseId, channel: "TELEGRAM", status: "PENDING" },
      });
      attempted++;
      if (await runChannel(attempt.id, "TELEGRAM", () => sendTelegram(message.text)))
        sent++;
    }

    if (isEmailConfigured) {
      const attempt = await prisma.notificationAttempt.create({
        data: { responseId, channel: "EMAIL", status: "PENDING" },
      });
      attempted++;
      if (
        await runChannel(attempt.id, "EMAIL", () =>
          sendEmail(message.subject, message.text),
        )
      )
        sent++;
    }

    if (!isTelegramConfigured && !isEmailConfigured) {
      logger.warn("No notification channel configured; response saved only.", {
        responseId,
      });
    }
  } catch (err) {
    // Absolutely never let notification issues bubble into the request path.
    logger.error("dispatchNotifications unexpected error", {
      responseId,
      error: sanitizeError(err),
    });
  }

  return { attempted, sent };
}

/** Retry a single failed/pending notification attempt from the admin dashboard. */
export async function retryNotification(
  attemptId: string,
): Promise<{ ok: boolean }> {
  const attempt = await prisma.notificationAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) return { ok: false };

  const loaded = await loadMessageForResponse(attempt.responseId);
  if (!loaded) return { ok: false };
  const { message } = loaded;

  const send =
    attempt.channel === "TELEGRAM"
      ? () => sendTelegram(message.text)
      : () => sendEmail(message.subject, message.text);

  const ok = await runChannel(attempt.id, attempt.channel, send);
  return { ok };
}
