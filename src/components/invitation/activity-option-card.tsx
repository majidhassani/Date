"use client";

import {
  Clock,
  Coffee,
  Croissant,
  Dumbbell,
  Footprints,
  Gift,
  Landmark,
  PenLine,
  Zap,
  Home,
  Trees,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { ActivityDef, PlaceKind } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Coffee,
  Footprints,
  Dumbbell,
  Croissant,
  Landmark,
  Gift,
  PenLine,
};

const PLACE_META: Record<PlaceKind, { label: string; icon: LucideIcon }> = {
  indoor: { label: "سرپوشیده", icon: Home },
  outdoor: { label: "فضای باز", icon: Trees },
  mixed: { label: "ترکیبی", icon: Landmark },
};

/** Presentational activity card. Interactivity is provided by a wrapping label. */
export function ActivityOptionCard({
  activity,
  selected,
}: {
  activity: ActivityDef;
  selected: boolean;
}) {
  const Icon = ICONS[activity.icon] ?? Coffee;
  const place = activity.place ? PLACE_META[activity.place] : null;
  const PlaceIcon = place?.icon;

  return (
    <div
      className={cn(
        "relative flex h-full items-start gap-4 rounded-xl border bg-surface p-4 shadow-sm transition-all",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold leading-tight">{activity.title}</h3>
          {selected ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {activity.description}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="muted">
            <Zap className="h-3 w-3" />
            {activity.energy}
          </Badge>
          {activity.duration ? (
            <Badge variant="muted">
              <Clock className="h-3 w-3" />
              {activity.duration}
            </Badge>
          ) : null}
          {place && PlaceIcon ? (
            <Badge variant="outline">
              <PlaceIcon className="h-3 w-3" />
              {place.label}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
