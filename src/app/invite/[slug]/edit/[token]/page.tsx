import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, KeyRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { buildPublicConfig } from "@/lib/invitation-config";
import type { ActivityId } from "@/lib/config";
import { formatUtcAsJalali } from "@/lib/datetime";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { InvitationExperience } from "@/components/invitation/invitation-experience";
import type { FlowData } from "@/components/invitation/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ویرایش پاسخ",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EditResponsePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  let response = null;
  try {
    const tokenHash = hashToken(token);
    response = await prisma.response.findFirst({
      where: {
        secureEditTokenHash: tokenHash,
        answer: "ACCEPTED",
        invitation: { slug },
      },
      include: {
        availabilityChoices: { orderBy: { rank: "asc" } },
        invitation: true,
        finalPlan: true,
      },
    });
  } catch {
    response = null;
  }

  if (!response) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={KeyRound}
            title="این لینک ویرایش معتبر نیست"
            description="ممکنه لینک اشتباه باشه یا دیگه معتبر نباشه."
            action={
              <Button asChild variant="outline">
                <Link href={`/invite/${slug}`}>بازگشت به دعوت</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const config = buildPublicConfig({
    ...response.invitation,
    responses: [{ id: response.id }],
  });

  const initial: FlowData = {
    activityType: (response.activityType as ActivityId | null) ?? null,
    customActivity: response.customActivity ?? "",
    note: response.note ?? "",
    availability: response.availabilityChoices.map((c) => ({
      localDate: c.localDate,
      localTime: c.localTime,
    })),
    altTime: "",
    // Phone is never sent to the browser. Leaving it empty preserves the stored
    // (encrypted) number unless a new one is explicitly entered.
    phone: "",
    phoneConsent: false,
  };

  const finalPlanLabel = response.finalPlan
    ? formatUtcAsJalali(response.finalPlan.finalDatetimeUtc).full
    : null;

  return (
    <AppShell hero>
      {finalPlanLabel ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-success/40 bg-success/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-success">قرار نهایی تأیید شد ✅</p>
            <p className="text-sm text-muted-foreground">{finalPlanLabel}</p>
          </div>
          <Button asChild variant="outline">
            <a href={`/api/calendar/${token}`}>
              <CalendarPlus className="h-4 w-4" />
              افزودن به تقویم
            </a>
          </Button>
        </div>
      ) : null}

      <InvitationExperience
        slug={slug}
        config={config}
        editContext={{ token, initial }}
      />
    </AppShell>
  );
}

