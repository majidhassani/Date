import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Token-gated calendar download for Nilou. Returns an .ics ONLY once Majid has
 * confirmed a final plan. The edit token is required — no enumeration possible.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 10) {
    return new Response("Not found", { status: 404 });
  }

  const response = await prisma.response.findFirst({
    where: { secureEditTokenHash: hashToken(token) },
    include: { finalPlan: true, invitation: true },
  });

  if (!response?.finalPlan) {
    return new Response("Not found", { status: 404 });
  }

  const ics = buildIcs({
    uid: `${response.id}@daavat`,
    title: `${response.finalPlan.activity} با ${response.invitation.ownerName}`,
    description: "قرار دوستانه",
    location: response.finalPlan.locationNote ?? undefined,
    startUtc: response.finalPlan.finalDatetimeUtc,
    durationMinutes: 90,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plan.ics"',
      "Cache-Control": "no-store",
    },
  });
}
