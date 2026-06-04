import {
  IssueCategory,
  Locale,
  MessageType,
  QRCodeType,
  RecommendationCategory,
  SectionType,
} from "@prisma/client";

// ── Locales ────────────────────────────────────────────────────────────────

export const LOCALES: Locale[] = ["DE", "EN", "IT", "FR", "NL", "ES", "TR"];

export const LOCALE_LABELS: Record<Locale, { name: string; native: string; flag: string }> = {
  DE: { name: "German", native: "Deutsch", flag: "🇩🇪" },
  EN: { name: "English", native: "English", flag: "🇬🇧" },
  IT: { name: "Italian", native: "Italiano", flag: "🇮🇹" },
  FR: { name: "French", native: "Français", flag: "🇫🇷" },
  NL: { name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  ES: { name: "Spanish", native: "Español", flag: "🇪🇸" },
  TR: { name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
};

// ── Guide sections ───────────────────────────────────────────────────────────
// Ordered as they should appear in a freshly created guide. `lucide` names the
// icon used in both the host builder and the public guide.

export interface SectionTypeMeta {
  type: SectionType;
  label: string;
  slug: string;
  lucide: string;
  group: "arrival" | "home" | "rules" | "departure" | "local" | "help";
}

export const SECTION_TYPES: SectionTypeMeta[] = [
  { type: "WELCOME", label: "Welcome", slug: "welcome", lucide: "Hand", group: "arrival" },
  { type: "CHECK_IN", label: "Check-in", slug: "check-in", lucide: "LogIn", group: "arrival" },
  { type: "FIND_PROPERTY", label: "How to find the property", slug: "find-property", lucide: "MapPin", group: "arrival" },
  { type: "PARKING", label: "Parking", slug: "parking", lucide: "ParkingCircle", group: "arrival" },
  { type: "KEYBOX", label: "Keybox / smart lock", slug: "keybox", lucide: "KeyRound", group: "arrival" },
  { type: "WIFI", label: "WiFi", slug: "wifi", lucide: "Wifi", group: "home" },
  { type: "HEATING", label: "Heating / thermostat", slug: "heating", lucide: "Thermometer", group: "home" },
  { type: "HOT_WATER", label: "Hot water", slug: "hot-water", lucide: "Droplets", group: "home" },
  { type: "KITCHEN", label: "Kitchen appliances", slug: "kitchen", lucide: "CookingPot", group: "home" },
  { type: "DISHWASHER", label: "Dishwasher", slug: "dishwasher", lucide: "Utensils", group: "home" },
  { type: "WASHING_MACHINE", label: "Washing machine", slug: "washing-machine", lucide: "WashingMachine", group: "home" },
  { type: "TV", label: "TV / remote", slug: "tv", lucide: "Tv", group: "home" },
  { type: "TRASH", label: "Trash & recycling", slug: "trash", lucide: "Trash2", group: "home" },
  { type: "STORAGE", label: "Ski room / bike storage", slug: "storage", lucide: "Bike", group: "home" },
  { type: "HOUSE_RULES", label: "House rules", slug: "house-rules", lucide: "ScrollText", group: "rules" },
  { type: "QUIET_HOURS", label: "Quiet hours", slug: "quiet-hours", lucide: "Moon", group: "rules" },
  { type: "SAFETY", label: "Safety & emergency", slug: "safety", lucide: "ShieldAlert", group: "rules" },
  { type: "CHECKOUT", label: "Checkout", slug: "checkout", lucide: "LogOut", group: "departure" },
  { type: "LOCAL_RECOMMENDATIONS", label: "Local recommendations", slug: "recommendations", lucide: "Sparkles", group: "local" },
  { type: "PUBLIC_TRANSPORT", label: "Public transport", slug: "public-transport", lucide: "TrainFront", group: "local" },
  { type: "TAXI", label: "Taxi", slug: "taxi", lucide: "Car", group: "local" },
  { type: "SUPERMARKETS", label: "Supermarkets", slug: "supermarkets", lucide: "ShoppingCart", group: "local" },
  { type: "RESTAURANTS", label: "Restaurants", slug: "restaurants", lucide: "UtensilsCrossed", group: "local" },
  { type: "PHARMACY", label: "Pharmacy", slug: "pharmacy", lucide: "Pill", group: "local" },
  { type: "DOCTOR", label: "Doctor / emergency", slug: "doctor", lucide: "Stethoscope", group: "help" },
  { type: "FAQ", label: "FAQs", slug: "faq", lucide: "HelpCircle", group: "help" },
  { type: "CUSTOM", label: "Custom section", slug: "custom", lucide: "FileText", group: "home" },
];

export const SECTION_TYPE_MAP: Record<SectionType, SectionTypeMeta> = Object.fromEntries(
  SECTION_TYPES.map((s) => [s.type, s]),
) as Record<SectionType, SectionTypeMeta>;

// ── Issues ─────────────────────────────────────────────────────────────────

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  CHECK_IN: "Check-in",
  KEYBOX: "Keybox / smart lock",
  WIFI: "WiFi",
  HEATING: "Heating",
  HOT_WATER: "Hot water",
  ELECTRICITY: "Electricity",
  CLEANLINESS: "Cleanliness",
  PARKING: "Parking",
  NOISE: "Noise",
  BROKEN_ITEM: "Broken item",
  MISSING_ITEM: "Missing item",
  OTHER: "Other",
};

export const ISSUE_STATUS_FLOW = [
  "NEW",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

// ── Recommendations ──────────────────────────────────────────────────────────

export const RECOMMENDATION_CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  RESTAURANT: "Restaurant",
  BREAKFAST: "Breakfast place",
  SUPERMARKET: "Supermarket",
  PHARMACY: "Pharmacy",
  DOCTOR: "Doctor",
  TAXI: "Taxi",
  AIRPORT_TRANSFER: "Airport transfer",
  PUBLIC_TRANSPORT: "Public transport",
  SKI_BUS: "Ski bus",
  BIKE_RENTAL: "Bike rental",
  SKI_RENTAL: "Ski rental",
  ATTRACTION: "Attraction",
  HIKING: "Hiking route",
  COWORKING: "Coworking space",
  PARKING_GARAGE: "Parking garage",
  OTHER: "Other",
};

// ── Messaging ─────────────────────────────────────────────────────────────

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  BOOKING_CONFIRMATION: "Booking confirmation",
  PRE_ARRIVAL: "Pre-arrival message",
  CHECK_IN_DAY: "Check-in day message",
  SATISFACTION_CHECK: "Satisfaction check",
  CHECKOUT_REMINDER: "Checkout reminder",
  REVIEW_REQUEST: "Review request",
  PROBLEM_FOLLOW_UP: "Problem follow-up",
  LATE_CHECKOUT: "Late checkout info",
  PARKING_INFO: "Parking info",
  HOUSE_RULES_REMINDER: "House rules reminder",
};

/** Template variables available when rendering a message. */
export const MESSAGE_VARIABLES = [
  "guest_name",
  "property_name",
  "check_in_time",
  "check_out_time",
  "guide_link",
  "wifi_name",
  "wifi_password",
  "parking_info",
  "host_name",
  "host_phone",
  "address",
] as const;

// ── QR codes ─────────────────────────────────────────────────────────────

export const QR_CODE_LABELS: Record<QRCodeType, string> = {
  FULL_GUIDE: "Full property guide",
  WIFI: "WiFi instructions",
  HEATING: "Heating instructions",
  PARKING: "Parking instructions",
  TRASH: "Trash instructions",
  CHECKOUT: "Checkout instructions",
  ISSUE_REPORT: "Report an issue",
  RECOMMENDATIONS: "Local recommendations",
  SECTION: "Specific section",
};

// ── Inventory & cleaning defaults ─────────────────────────────────────────

export const DEFAULT_INVENTORY_ITEMS: { name: string; category: string; unit: string }[] = [
  { name: "Toilet paper", category: "Bathroom", unit: "rolls" },
  { name: "Soap", category: "Bathroom", unit: "bottles" },
  { name: "Shampoo", category: "Bathroom", unit: "bottles" },
  { name: "Coffee", category: "Kitchen", unit: "packs" },
  { name: "Tea", category: "Kitchen", unit: "boxes" },
  { name: "Dishwasher tabs", category: "Kitchen", unit: "tabs" },
  { name: "Trash bags", category: "Cleaning", unit: "rolls" },
  { name: "Towels", category: "Linen", unit: "pcs" },
  { name: "Bed linen", category: "Linen", unit: "sets" },
  { name: "Batteries", category: "Maintenance", unit: "pcs" },
  { name: "Light bulbs", category: "Maintenance", unit: "pcs" },
  { name: "Cleaning supplies", category: "Cleaning", unit: "units" },
];

export const DEFAULT_CLEANING_CHECKLIST: { label: string; room: string }[] = [
  { label: "Bedsheets changed", room: "Bedroom" },
  { label: "Towels replaced", room: "Bathroom" },
  { label: "Bathroom cleaned", room: "Bathroom" },
  { label: "Kitchen cleaned", room: "Kitchen" },
  { label: "Trash removed", room: "General" },
  { label: "Floors cleaned", room: "General" },
  { label: "Windows checked", room: "General" },
  { label: "Heating set to default", room: "General" },
  { label: "Keys returned to keybox", room: "Entrance" },
  { label: "Supplies checked & restocked", room: "General" },
  { label: "Photos uploaded", room: "General" },
];
