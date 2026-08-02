/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * Suitable for a single-instance deployment (Docker/VPS) and for basic
 * protection on serverless. For multi-instance horizontal scaling, back this
 * with Redis/Upstash — the interface is intentionally simple to swap out.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** Named presets used across the app. */
export const RATE_LIMITS = {
  submit: { limit: 15, windowMs: 60_000 }, // 15 submissions / minute / key
  noClick: { limit: 40, windowMs: 60_000 },
  adminLogin: { limit: 8, windowMs: 5 * 60_000 }, // 8 tries / 5 minutes
  phoneReveal: { limit: 30, windowMs: 60_000 },
} as const;
