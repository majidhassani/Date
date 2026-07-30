import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ACTIVITY_BY_ID, type ActivityId } from "@/lib/config";
import { formatLocalDateTimeLabel, formatUtcAsJalali } from "@/lib/datetime";
import { RANK_LABELS } from "@/components/invitation/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminResponseDetail,
  type ResponseDetailView,
} from "@/components/admin/admin-response-detail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "جزئیات پاسخ",
  robots: { index: false, follow: false },
};

function activityTitle(answer: string, activityType: string | null): string {
  if (answer === "DECLINED") return "—";
  if (!activityType) return "—";
  if (activityType === "CUSTOM") return "انتخاب با تو";
  return ACTIVITY_BY_ID[activityType as ActivityId]?.title ?? activityType;
}

export default async function AdminResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const response = await prisma.response.findUnique({
    where: { id },
    include: {
      availabilityChoices: { orderBy: { rank: "asc" } },
      notificationAttempts: { orderBy: { createdAt: "asc" } },
      finalPlan: true,
      invitation: true,
    },
  });
  if (!response) notFound();

  const title = activityTitle(response.answer, response.activityType);
  const submittedAtLabel = formatUtcAsJalali(response.submittedAt).full;

  const availability = response.availabilityChoices.map((c, i) => ({
    rank: c.rank,
    rankLabel: RANK_LABELS[i] ?? `انتخاب ${i + 1}`,
    label: formatLocalDateTimeLabel(c.localDate, c.localTime),
    localDate: c.localDate,
    localTime: c.localTime,
  }));

  const summaryText = [
    `نتیجه: ${response.answer === "ACCEPTED" ? "موافقت" : "رد دعوت"}`,
    `برنامه: ${title}${response.customActivity ? ` — ${response.customActivity}` : ""}`,
    ...availability.map((c) => `${c.rankLabel}: ${c.label}`),
    response.note ? `یادداشت: ${response.note}` : "",
    `زمان ثبت: ${submittedAtLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const view: ResponseDetailView = {
    id: response.id,
    answer: response.answer,
    invitation: {
      slug: response.invitation.slug,
      inviteeName: response.invitation.inviteeName,
      status: response.invitation.status,
    },
    activityTitle: title,
    customActivity: response.customActivity,
    note: response.note,
    noClickCount: response.noClickCount,
    submittedAtLabel,
    hasPhone: Boolean(response.inviteePhoneEncrypted && response.phoneConsentAt),
    phoneLast4: response.inviteePhoneLast4,
    phoneConsentAtLabel: response.phoneConsentAt
      ? formatUtcAsJalali(response.phoneConsentAt).full
      : null,
    availability,
    notifications: response.notificationAttempts.map((n) => ({
      id: n.id,
      channel: n.channel,
      status: n.status,
      attemptCount: n.attemptCount,
      errorMessage: n.errorMessage,
      sentAtLabel: n.sentAt ? formatUtcAsJalali(n.sentAt).full : null,
    })),
    finalPlan: response.finalPlan
      ? {
          activity: response.finalPlan.activity,
          whenLabel: formatUtcAsJalali(response.finalPlan.finalDatetimeUtc).full,
          locationNote: response.finalPlan.locationNote,
          datetimeUtcIso: response.finalPlan.finalDatetimeUtc.toISOString(),
        }
      : null,
    summaryText,
  };

  const auditLogs = await prisma.adminAuditLog.findMany({
    where: { entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <AppShell contentClassName="max-w-3xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ChevronRight className="h-4 w-4" />
            بازگشت به فهرست
          </Link>
        </Button>
      </div>

      <AdminResponseDetail view={view} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>گزارش فعالیت مدیر</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">فعالیتی ثبت نشده.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
                >
                  <span className="font-medium">{log.action}</span>
                  <span className="text-xs text-muted-foreground tnum">
                    {formatUtcAsJalali(log.createdAt).full}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
