"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDER = ["system", "light", "dark"] as const;
const LABEL: Record<string, string> = {
  system: "هماهنگ با سیستم",
  light: "روشن",
  dark: "تیره",
};

/** Cycles System → Light → Dark. Announces the change for screen readers. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = (theme ?? "system") as (typeof ORDER)[number];

  function cycle() {
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length]!;
    setTheme(next);
  }

  // Until mounted, render values that match the server (theme is unknown on the
  // server) to avoid a hydration mismatch. After mount they reflect the theme.
  const Icon = !mounted
    ? Monitor
    : current === "light"
      ? Sun
      : current === "dark"
        ? Moon
        : Monitor;
  const activeLabel = mounted ? LABEL[current] : LABEL.system;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={cycle}
        aria-label={`تغییر پوسته؛ حالت فعلی: ${activeLabel}`}
        title={`پوسته: ${activeLabel}`}
      >
        <Icon className="h-5 w-5" />
      </Button>
      <span aria-live="polite" className="sr-only">
        {mounted ? `پوسته: ${activeLabel}` : ""}
      </span>
    </>
  );
}
