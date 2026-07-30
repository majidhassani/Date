import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationStatusBadge } from "./notification-status-badge";

export type AdminRow = {
  id: string;
  answer: "ACCEPTED" | "DECLINED";
  activityTitle: string;
  whenLabel: string;
  phoneMasked: string;
  notif: { status: "PENDING" | "SENT" | "FAILED" } | null;
  submittedAtLabel: string;
};

/** Server-rendered list of responses. No full phone numbers in the markup. */
export function AdminResponseTable({ rows }: { rows: AdminRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead className="border-b border-border bg-muted/40 text-muted-foreground">
          <tr className="[&>th]:whitespace-nowrap [&>th]:px-4 [&>th]:py-3 [&>th]:text-start [&>th]:font-medium">
            <th>نتیجه</th>
            <th>برنامه</th>
            <th>اولین زمان</th>
            <th>شماره</th>
            <th>اعلان</th>
            <th>زمان ثبت</th>
            <th className="sr-only">مشاهده</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                {row.answer === "ACCEPTED" ? (
                  <Badge variant="success">موافقت</Badge>
                ) : (
                  <Badge variant="muted">رد دعوت</Badge>
                )}
              </td>
              <td className="px-4 py-3 font-medium">{row.activityTitle}</td>
              <td className="px-4 py-3">{row.whenLabel}</td>
              <td className="px-4 py-3 tnum" dir="ltr">
                {row.phoneMasked}
              </td>
              <td className="px-4 py-3">
                {row.notif ? (
                  <NotificationStatusBadge status={row.notif.status} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.submittedAtLabel}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/responses/${row.id}`}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  جزئیات
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
