import { isProd } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

/** Keys whose values must always be redacted from structured logs. */
const SENSITIVE_KEYS = [
  "phone",
  "inviteePhone",
  "inviteePhoneEncrypted",
  "phoneNumber",
  "password",
  "passwordHash",
  "token",
  "secureEditToken",
  "sessionSecret",
  "encryptionKey",
  "authorization",
  "cookie",
];

const PHONE_LIKE = /(\+?\d[\d\s-]{7,}\d)/g;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
    return "«redacted»";
  }
  if (typeof value === "string") {
    // Defensive: never let a full phone number slip into logs.
    return value.replace(PHONE_LIKE, "«redacted-number»");
  }
  return value;
}

function redact(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => redact(v));
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const redacted = redactValue(k, v);
      out[k] = redacted === v ? redact(v) : redacted;
    }
    return out;
  }
  return input;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const line = isProd ? JSON.stringify(entry) : formatDev(level, message, entry.meta);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

function formatDev(level: LogLevel, message: string, meta: unknown) {
  const tag = `[${level.toUpperCase()}]`;
  return meta ? `${tag} ${message} ${JSON.stringify(meta)}` : `${tag} ${message}`;
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) =>
    !isProd && write("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => write("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => write("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => write("error", m, meta),
};
