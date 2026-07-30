import { Badge } from "@/components/ui/badge";

type Status = "PENDING" | "SENT" | "FAILED";
type Channel = "TELEGRAM" | "EMAIL";

const STATUS_META: Record<
  Status,
  { label: string; variant: "success" | "destructive" | "muted" }
> = {
  SENT: { label: "ارسال شد", variant: "success" },
  FAILED: { label: "ناموفق", variant: "destructive" },
  PENDING: { label: "در انتظار", variant: "muted" },
};

const CHANNEL_LABEL: Record<Channel, string> = {
  TELEGRAM: "تلگرام",
  EMAIL: "ایمیل",
};

export function NotificationStatusBadge({
  status,
  channel,
}: {
  status: Status;
  channel?: Channel;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant}>
      {channel ? `${CHANNEL_LABEL[channel]}: ` : ""}
      {meta.label}
    </Badge>
  );
}

export { CHANNEL_LABEL };
