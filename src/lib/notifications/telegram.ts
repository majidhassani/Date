import "server-only";
import { env, isTelegramConfigured } from "../env";

/**
 * Send a plain-text message to the configured Telegram chat.
 * Plain text (no parse_mode) avoids any markup-injection concerns.
 */
export async function sendTelegram(text: string): Promise<void> {
  if (!isTelegramConfigured) {
    throw new Error("Telegram is not configured.");
  }

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
    // Never hang the request path forever.
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; description?: string }
    | null;
  if (!data?.ok) {
    throw new Error(`Telegram API error: ${data?.description ?? "unknown"}`);
  }
}
