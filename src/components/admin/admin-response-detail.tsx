"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Loader2,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  confirmFinalPlan,
  deletePhone,
  exportResponse,
  markCompleted,
  retryNotificationAction,
  revealPhone,
} from "@/server/actions/admin";
import { buildIcs } from "@/lib/ics";
import { maskFromLast4 } from "@/lib/phone";
import { toPersianDigits } from "@/lib/persian";
import type { PhoneReveal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NotificationStatusBadge,
  CHANNEL_LABEL,
} from "./notification-status-badge";

export type ResponseDetailView = {
  id: string;
  answer: "ACCEPTED" | "DECLINED";
  invitation: { slug: string; inviteeName: string; status: string };
  activityTitle: string;
  customActivity: string | null;
  note: string | null;
  noClickCount: number;
  submittedAtLabel: string;
  hasPhone: boolean;
  phoneLast4: string | null;
  phoneConsentAtLabel: string | null;
  availability: {
    rank: number;
    rankLabel: string;
    label: string;
    localDate: string;
    localTime: string;
  }[];
  notifications: {
    id: string;
    channel: "TELEGRAM" | "EMAIL";
    status: "PENDING" | "SENT" | "FAILED";
    attemptCount: number;
    errorMessage: string | null;
    sentAtLabel: string | null;
  }[];
  finalPlan: {
    activity: string;
    whenLabel: string;
    locationNote: string | null;
    datetimeUtcIso: string;
  } | null;
  summaryText: string;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

function triggerDownload(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminResponseDetail({ view }: { view: ResponseDetailView }) {
  const router = useRouter();

  // Phone reveal (fetched fresh each time the dialog opens)
  const [revealOpen, setRevealOpen] = React.useState(false);
  const [revealed, setRevealed] = React.useState<PhoneReveal | null>(null);
  const [revealing, setRevealing] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Confirm-plan form
  const [choiceIndex, setChoiceIndex] = React.useState(0);
  const [activityText, setActivityText] = React.useState(
    view.finalPlan?.activity ?? view.activityTitle,
  );
  const [locationNote, setLocationNote] = React.useState(
    view.finalPlan?.locationNote ?? "",
  );
  const [includePhone, setIncludePhone] = React.useState(false);

  async function handleRevealOpen(open: boolean) {
    setRevealOpen(open);
    if (open) {
      setRevealing(true);
      setRevealed(null);
      const res = await revealPhone(view.id);
      setRevealing(false);
      if (res.success) setRevealed(res.data);
      else toast.error(res.error.message);
    } else {
      // Never retain the decrypted number after closing.
      setRevealed(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    const res = await deletePhone(view.id);
    setBusy(null);
    setDeleteOpen(false);
    if (res.success) {
      toast.success("شماره برای همیشه حذف شد.");
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  }

  async function handleRetry(attemptId: string) {
    setBusy(`retry-${attemptId}`);
    const res = await retryNotificationAction(attemptId);
    setBusy(null);
    if (res.success && res.data.ok) {
      toast.success("اعلان با موفقیت ارسال شد.");
    } else if (res.success) {
      toast.error("ارسال دوباره هم موفق نبود.");
    } else {
      toast.error(res.error.message);
    }
    router.refresh();
  }

  async function handleConfirmPlan() {
    const choice = view.availability[choiceIndex];
    if (!choice) {
      toast.error("یک زمان انتخاب کن.");
      return;
    }
    setBusy("confirm");
    const res = await confirmFinalPlan({
      responseId: view.id,
      activity: activityText,
      localDate: choice.localDate,
      localTime: choice.localTime,
      locationNote,
    });
    setBusy(null);
    setConfirmOpen(false);
    if (res.success) {
      toast.success("قرار نهایی ثبت شد.");
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  }

  async function handleComplete() {
    setBusy("complete");
    const res = await markCompleted(view.id);
    setBusy(null);
    if (res.success) {
      toast.success("دعوت تکمیل‌شده علامت خورد.");
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  }

  async function handleExport() {
    setBusy("export");
    const res = await exportResponse({ responseId: view.id, includePhone });
    setBusy(null);
    setExportOpen(false);
    if (res.success) {
      triggerDownload(res.data.filename, res.data.json, "application/json");
      toast.success("فایل JSON دانلود شد.");
    } else {
      toast.error(res.error.message);
    }
  }

  function handleIcs() {
    if (!view.finalPlan) return;
    const ics = buildIcs({
      uid: `${view.id}@daavat`,
      title: `${view.finalPlan.activity} با ${view.invitation.inviteeName}`,
      description: "قرار دوستانه",
      location: view.finalPlan.locationNote ?? undefined,
      startUtc: new Date(view.finalPlan.datetimeUtcIso),
      durationMinutes: 90,
    });
    triggerDownload(`plan-${view.id}.ics`, ics, "text/calendar");
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>جزئیات پاسخ</CardTitle>
          {view.answer === "ACCEPTED" ? (
            <Badge variant="success">موافقت</Badge>
          ) : (
            <Badge variant="muted">رد دعوت</Badge>
          )}
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="برنامه">
              {view.activityTitle}
              {view.customActivity ? (
                <p className="mt-1 text-muted-foreground">
                  {view.customActivity}
                </p>
              ) : null}
            </DetailRow>
            {view.availability.length > 0 ? (
              <DetailRow label="زمان‌ها">
                <ol className="space-y-1">
                  {view.availability.map((c) => (
                    <li key={c.rank} className="flex items-center gap-2">
                      <Badge variant="default">{c.rankLabel}</Badge>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ol>
              </DetailRow>
            ) : null}
            {view.note ? (
              <DetailRow label="یادداشت">
                <span className="whitespace-pre-line">{view.note}</span>
              </DetailRow>
            ) : null}
            <DetailRow label="کلیک روی «نه»">
              <span className="tnum">{toPersianDigits(view.noClickCount)}</span>
            </DetailRow>
            <DetailRow label="زمان ثبت">{view.submittedAtLabel}</DetailRow>
            <DetailRow label="وضعیت دعوت">{view.invitation.status}</DetailRow>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton
              value={view.summaryText}
              label="کپی خلاصه"
              toastMessage="خلاصه‌ی پاسخ کپی شد."
            />
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              disabled={busy === "export"}
            >
              <Download className="h-4 w-4" />
              خروجی JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phone */}
      {view.answer === "ACCEPTED" ? (
        <Card>
          <CardHeader>
            <CardTitle>شماره تماس</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.hasPhone ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tnum text-lg font-semibold" dir="ltr">
                    {view.phoneLast4 ? maskFromLast4(view.phoneLast4) : "—"}
                  </span>
                  {view.phoneConsentAtLabel ? (
                    <Badge variant="success">
                      رضایت ثبت‌شده: {view.phoneConsentAtLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog open={revealOpen} onOpenChange={handleRevealOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Eye className="h-4 w-4" />
                        نمایش شماره
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>شماره‌ی نیلو</DialogTitle>
                        <DialogDescription>
                          این شماره فقط برای هماهنگی همین دعوت است.
                        </DialogDescription>
                      </DialogHeader>
                      {revealing ? (
                        <div className="flex items-center gap-2 py-4 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          در حال رمزگشایی…
                        </div>
                      ) : revealed ? (
                        <div className="space-y-4">
                          <p
                            className="tnum text-center text-2xl font-bold"
                            dir="ltr"
                          >
                            {revealed.display}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <CopyButton
                              value={revealed.local}
                              label="کپی"
                              toastMessage="شماره کپی شد."
                            />
                            <Button asChild variant="outline">
                              <a href={revealed.telHref}>
                                <Phone className="h-4 w-4" />
                                تماس
                              </a>
                            </Button>
                            <Button asChild variant="outline">
                              <a href={revealed.smsHref}>
                                <MessageSquare className="h-4 w-4" />
                                پیامک
                              </a>
                            </Button>
                            <Button asChild variant="outline">
                              <a
                                href={revealed.whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-4 w-4" />
                                واتساپ
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="py-4 text-sm text-muted-foreground">
                          شماره‌ای در دسترس نیست.
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        حذف شماره
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>حذف دائمی شماره</DialogTitle>
                        <DialogDescription>
                          این کار قابل بازگشت نیست. شماره‌ی رمزنگاری‌شده و اطلاعات
                          رضایت برای همیشه حذف می‌شن.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={busy === "delete"}
                        >
                          {busy === "delete" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          حذف دائمی
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setDeleteOpen(false)}
                        >
                          انصراف
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                نیلو شماره‌ای وارد نکرده.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>اعلان‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {view.notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              اعلانی ثبت نشده (احتمالاً کانالی پیکربندی نشده).
            </p>
          ) : (
            view.notifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {CHANNEL_LABEL[n.channel]}
                    </span>
                    <NotificationStatusBadge status={n.status} />
                    <span className="text-xs text-muted-foreground tnum">
                      تلاش: {toPersianDigits(n.attemptCount)}
                    </span>
                  </div>
                  {n.errorMessage ? (
                    <p className="text-xs text-destructive">{n.errorMessage}</p>
                  ) : n.sentAtLabel ? (
                    <p className="text-xs text-muted-foreground">
                      {n.sentAtLabel}
                    </p>
                  ) : null}
                </div>
                {n.status !== "SENT" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(n.id)}
                    disabled={busy === `retry-${n.id}`}
                  >
                    {busy === `retry-${n.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    تلاش دوباره
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Final plan */}
      {view.answer === "ACCEPTED" ? (
        <Card>
          <CardHeader>
            <CardTitle>قرار نهایی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.finalPlan ? (
              <div className="space-y-2 rounded-lg bg-success/10 p-4">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CalendarCheck className="h-5 w-5" />
                  تأیید شده
                </div>
                <p className="text-sm">
                  <span className="font-medium">{view.finalPlan.activity}</span> —{" "}
                  {view.finalPlan.whenLabel}
                </p>
                {view.finalPlan.locationNote ? (
                  <p className="text-sm text-muted-foreground">
                    مکان: {view.finalPlan.locationNote}
                  </p>
                ) : null}
                <Button variant="outline" size="sm" onClick={handleIcs}>
                  <CalendarPlus className="h-4 w-4" />
                  دانلود تقویم (ICS)
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                هنوز قرار نهایی ثبت نشده.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button disabled={view.availability.length === 0}>
                    <CalendarCheck className="h-4 w-4" />
                    {view.finalPlan ? "ویرایش قرار نهایی" : "تأیید قرار نهایی"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تأیید قرار نهایی</DialogTitle>
                    <DialogDescription>
                      یکی از زمان‌های پیشنهادی نیلو رو انتخاب کن.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">زمان</legend>
                      {view.availability.map((c, i) => (
                        <label
                          key={c.rank}
                          className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="finalChoice"
                            checked={choiceIndex === i}
                            onChange={() => setChoiceIndex(i)}
                          />
                          <span>
                            {c.rankLabel} — {c.label}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <div className="space-y-2">
                      <Label htmlFor="finalActivity">برنامه</Label>
                      <Input
                        id="finalActivity"
                        value={activityText}
                        onChange={(e) => setActivityText(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finalLocation">یادداشت مکان (خصوصی)</Label>
                      <Textarea
                        id="finalLocation"
                        value={locationNote}
                        onChange={(e) => setLocationNote(e.target.value)}
                        className="min-h-16"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleConfirmPlan} disabled={busy === "confirm"}>
                      {busy === "confirm" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      ثبت قرار
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                      انصراف
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={busy === "complete"}
              >
                <CheckCircle2 className="h-4 w-4" />
                علامت‌گذاری به‌عنوان تکمیل‌شده
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>خروجی JSON</DialogTitle>
            <DialogDescription>
              به‌صورت پیش‌فرض شماره‌ی تلفن در خروجی نیست.
            </DialogDescription>
          </DialogHeader>
          {view.hasPhone ? (
            <label className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={includePhone}
                onCheckedChange={(v) => setIncludePhone(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                شماره‌ی رمزگشایی‌شده هم در خروجی باشه (اقدام حساس).
              </span>
            </label>
          ) : null}
          <DialogFooter>
            <Button onClick={handleExport} disabled={busy === "export"}>
              {busy === "export" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              دانلود
            </Button>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
