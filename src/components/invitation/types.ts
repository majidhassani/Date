import type { ActivityId } from "@/lib/config";

export type AvailabilityItem = { localDate: string; localTime: string };

/** All client-side state gathered across the invitation steps. */
export type FlowData = {
  activityType: ActivityId | null;
  customActivity: string;
  note: string;
  /** Ordered list; rank is derived from position (index + 1). */
  availability: AvailabilityItem[];
  altTime: string;
  phone: string;
  phoneConsent: boolean;
};

export const emptyFlowData: FlowData = {
  activityType: null,
  customActivity: "",
  note: "",
  availability: [],
  altTime: "",
  phone: "",
  phoneConsent: false,
};

export const RANK_LABELS = ["انتخاب اول", "انتخاب دوم", "انتخاب سوم"] as const;
