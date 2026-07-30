import Link from "next/link";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// A minimal, branded landing. It intentionally does NOT reveal any invitation
// link — invitations are shared privately by their secure slug only.
export default function HomePage() {
  return (
    <AppShell hero>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">این یک فضای خصوصی است</h1>
            <p className="text-sm leading-7 text-muted-foreground">
              این‌جا خانه‌ی یک دعوت شخصی و دوستانه است. اگر لینک دعوت را داری،
              مستقیم از همان لینک وارد شو.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/admin">ورود مدیر</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
