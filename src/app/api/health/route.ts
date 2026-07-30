import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liveness + readiness probe. 200 when DB is reachable, 503 otherwise. */
export async function GET() {
  const checks: { server: boolean; database: boolean } = {
    server: true,
    database: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const healthy = checks.server && checks.database;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
