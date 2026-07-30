/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Validates critical environment configuration so unsafe deployments fail fast.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerEnv } = await import("./lib/env");
    assertServerEnv();
  }
}
