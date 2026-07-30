"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { adminLogin } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ email, password });
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error.message);
        setLoading(false);
      }
    } catch {
      setError("ورود با خطا مواجه شد. دوباره تلاش کن.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="admin-email">ایمیل</Label>
        <Input
          id="admin-email"
          type="email"
          dir="ltr"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">رمز عبور</Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={error ? "login-error" : undefined}
          required
        />
      </div>

      {error ? (
        <p id="login-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        ورود
      </Button>
    </form>
  );
}
