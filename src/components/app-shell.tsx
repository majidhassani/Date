import * as React from "react";
import { BrandWordmark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Page frame: sticky minimal header (brand + theme toggle), centered content,
 * and a quiet footer. Used across public and admin surfaces.
 */
export function AppShell({
  children,
  headerEnd,
  contentClassName,
  hero = false,
}: {
  children: React.ReactNode;
  headerEnd?: React.ReactNode;
  contentClassName?: string;
  /** When true, applies the subtle mesh gradient background for hero screens. */
  hero?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col bg-background",
        hero && "mesh-hero",
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <BrandWordmark />
          <div className="flex items-center gap-2">
            {headerEnd}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10",
          contentClassName,
        )}
      >
        {children}
      </main>

      <footer className="border-t border-border/70 py-6">
        <div className="mx-auto max-w-2xl px-4 text-center text-xs text-muted-foreground">
          یه دعوت خصوصی و دوستانه — با احترام ساخته شده.
        </div>
      </footer>
    </div>
  );
}
