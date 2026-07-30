/**
 * Client-safe invitation content: activity catalogue, default time slots and
 * shared copy. No secrets, no env, no owner phone — safe to import anywhere.
 * Per-invitation names come from the database and are passed as props.
 */

export type ActivityId =
  | "COFFEE_CHAT"
  | "WALK_AND_COFFEE"
  | "SPORTS"
  | "BREAKFAST"
  | "GALLERY"
  | "SURPRISE"
  | "CUSTOM";

export type EnergyLevel =
  | "آرام"
  | "متوسط"
  | "پرتحرک"
  | "فرهنگی"
  | "ماجراجویانه";

export type PlaceKind = "indoor" | "outdoor" | "mixed";

export type ActivityDef = {
  id: ActivityId;
  /** Lucide icon name resolved in the UI. */
  icon: string;
  title: string;
  description: string;
  /** Approximate duration label; omitted when not meaningful. */
  duration?: string;
  energy: EnergyLevel;
  place?: PlaceKind;
  /** When true, selecting this activity reveals a free-text field. */
  hasCustomText?: boolean;
};

export const ACTIVITIES: ActivityDef[] = [
  {
    id: "COFFEE_CHAT",
    icon: "Coffee",
    title: "قهوه و گپ",
    description: "یه کافه‌ی دنج، قهوه و یه گفت‌وگوی راحت",
    duration: "۶۰ تا ۹۰ دقیقه",
    energy: "آرام",
    place: "indoor",
  },
  {
    id: "WALK_AND_COFFEE",
    icon: "Footprints",
    title: "پیاده‌روی و قهوه",
    description: "یه قدم‌زدن سبک توی پارک یا حوالی پل طبیعت و بعدش قهوه",
    duration: "۹۰ تا ۱۲۰ دقیقه",
    energy: "متوسط",
    place: "outdoor",
  },
  {
    id: "SPORTS",
    icon: "Dumbbell",
    title: "قرار ورزشی",
    description: "بدمینتون، بولینگ، پدل، سنگ‌نوردی سالنی یا یه فعالیت دونفره‌ی سبک",
    duration: "حدود ۹۰ دقیقه",
    energy: "پرتحرک",
    place: "indoor",
  },
  {
    id: "BREAKFAST",
    icon: "Croissant",
    title: "صبحانه‌ی دونفره",
    description: "یه صبحانه‌ی خوب و بی‌دردسر برای شروع روز",
    duration: "۶۰ تا ۹۰ دقیقه",
    energy: "آرام",
    place: "indoor",
  },
  {
    id: "GALLERY",
    icon: "Landmark",
    title: "گالری‌گردی",
    description: "یه گالری یا موزه و بعدش قهوه یا نوشیدنی",
    duration: "حدود ۲ ساعت",
    energy: "فرهنگی",
    place: "mixed",
  },
  {
    id: "SURPRISE",
    icon: "Gift",
    title: "غافلگیرم کن",
    description: "انتخاب برنامه رو بسپر به مجید",
    energy: "ماجراجویانه",
    place: "mixed",
  },
  {
    id: "CUSTOM",
    icon: "PenLine",
    title: "انتخاب با تو",
    description: "اگه خودت ایده‌ی بهتری داری، همین‌جا بنویس",
    energy: "ماجراجویانه",
    hasCustomText: true,
  },
];

export const ACTIVITY_BY_ID: Record<ActivityId, ActivityDef> = ACTIVITIES.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<ActivityId, ActivityDef>,
);

/** Default, configurable time slots (24h "HH:mm"). Override via TIME_SLOTS env. */
export const DEFAULT_TIME_SLOTS = [
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "19:30",
  "21:00",
] as const;

/** Free-text and selection limits, enforced on both client and server. */
export const LIMITS = {
  note: 400,
  customActivity: 280,
  altTime: 200,
  maxAvailabilityChoices: 3,
  maxNoClicks: 4,
  locationNote: 300,
} as const;
