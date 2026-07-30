import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, Inbox } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { adminLogout } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { ACTIVITY_BY_ID, type ActivityId } from "@/lib/config";
import { formatLocalDateTimeLabel, formatUtcAsJalali } from "@/lib/datetime";
import { maskFromLast4 } from "@/lib/phone";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminResponseTable,
  type AdminRow,
} from "@/components/admin/admin-response-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "داشبورد",
  robots: { index: false, follow: false },
};

type NotifStatus = "PENDING" | "SENT" | "FAILED";

function overallNotif(
  attempts: { status: NotifStatus }[],
): { status: NotifStatus } | null {
  if (attempts.length === 0) return null;
  if (attempts.some((a) => a.status === "FAILED")) return { status: "FAILED" };
  if (attempts.some((a) => a.status === "SENT")) return { status: "SENT" };
  return { status: "PENDING" };
}

function activityTitle(r: {
  answer: "ACCEPTED" | "DECLINED";
  activityType: string | null;
}): string {
  if (r.answer === "DECLINED") return "—";
  if (!r.activityType) return "—";
  if (r.activityType === "CUSTOM") return "انتخاب با تو";
  return ACTIVITY_BY_ID[r.activityType as ActivityId]?.title ?? r.activityType;
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const responses = await prisma.response.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      availabilityChoices: { orderBy: { rank: "asc" }, take: 1 },
      notificationAttempts: { select: { status: true } },
      invitation: { select: { inviteeName: true } },
    },
  });

  const accepted = responses.filter((r) => r.answer === "ACCEPTED").length;
  const declined = responses.length - accepted;

  const rows: AdminRow[] = responses.map((r) => {
    const first = r.availabilityChoices[0];
    return {
      id: r.id,
      answer: r.answer,
      activityTitle: activityTitle(r),
      whenLabel: first
        ? formatLocalDateTimeLabel(first.localDate, first.localTime)
        : "—",
      phoneMasked: r.inviteePhoneLast4
        ? maskFromLast4(r.inviteePhoneLast4)
        : "—",
      notif: overallNotif(r.notificationAttempts),
      submittedAtLabel: formatUtcAsJalali(r.submittedAt).full,
    };
  });

  return (
    <AppShell
      headerEnd={
        <form action={adminLogout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </form>
      }
      contentClassName="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">پاسخ‌ها</h1>
            <p className="text-sm text-muted-foreground">
              ورود با «{session.email}»
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">موافقت: {accepted}</Badge>
            <Badge variant="muted">رد دعوت: {declined}</Badge>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="هنوز پاسخی ثبت نشده"
            description="به‌محض این‌که نیلو پاسخ بده، این‌جا نمایش داده می‌شه."
          />
        ) : (
          <AdminResponseTable rows={rows} />
        )}
      </div>
    </AppShell>
  );
}
