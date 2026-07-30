import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ورود مدیر",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <AppShell hero>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>ورود به داشبورد مدیریت</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
