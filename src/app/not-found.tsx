import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState
          icon={Compass}
          title="این صفحه پیدا نشد"
          description="ممکنه لینک اشتباه باشه یا دیگه معتبر نباشه."
          action={
            <Button asChild variant="outline">
              <Link href="/">بازگشت</Link>
            </Button>
          }
        />
      </div>
    </AppShell>
  );
}
