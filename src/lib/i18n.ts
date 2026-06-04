import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { LOCALES } from "@/lib/constants";

/** Coerce an arbitrary string (e.g. ?lang=de) to a valid Locale. */
export function toLocale(value: string | null | undefined, fallback: Locale = "EN"): Locale {
  if (!value) return fallback;
  const upper = value.toUpperCase();
  return (LOCALES as string[]).includes(upper) ? (upper as Locale) : fallback;
}

/**
 * Fetch translations for a set of entities of one type and return a lookup:
 * map[entityId][field][locale] = value.
 */
export async function loadTranslations(
  entityType: string,
  entityIds: string[],
): Promise<Record<string, Record<string, Partial<Record<Locale, string>>>>> {
  if (entityIds.length === 0) return {};
  const rows = await db.translation.findMany({
    where: { entityType, entityId: { in: entityIds } },
  });
  const map: Record<string, Record<string, Partial<Record<Locale, string>>>> = {};
  for (const r of rows) {
    map[r.entityId] ??= {};
    map[r.entityId][r.field] ??= {};
    map[r.entityId][r.field][r.locale] = r.value;
  }
  return map;
}

/** Resolve a field for a locale, falling back to the base value. */
export function translateField(
  base: string,
  translations: Record<string, Partial<Record<Locale, string>>> | undefined,
  field: string,
  locale: Locale,
  baseLocale: Locale,
): string {
  if (locale === baseLocale) return base;
  const value = translations?.[field]?.[locale];
  return value && value.trim() ? value : base;
}

// ── Guest-facing UI strings ──────────────────────────────────────────────
// EN is the complete source; other locales fall back to EN per missing key.

type UiKey =
  | "search_placeholder"
  | "all_topics"
  | "need_help"
  | "ask_assistant"
  | "ask_placeholder"
  | "report_issue"
  | "emergency"
  | "recommendations"
  | "last_updated"
  | "send"
  | "everything_good"
  | "report_problem"
  | "thank_you"
  | "contact_host"
  | "no_results"
  | "back_to_guide"
  | "language"
  | "wifi"
  | "checkout"
  | "your_stay_ok"
  | "submit"
  | "loading"
  | "powered_by";

const DICT: Record<Locale, Partial<Record<UiKey, string>>> = {
  EN: {
    search_placeholder: "Search the guide…",
    all_topics: "All topics",
    need_help: "I need help",
    ask_assistant: "Ask the assistant",
    ask_placeholder: "Ask anything about your stay…",
    report_issue: "Report an issue",
    emergency: "Emergency",
    recommendations: "Local recommendations",
    last_updated: "Last updated",
    send: "Send",
    everything_good: "Everything is good",
    report_problem: "Report a problem",
    thank_you: "Thank you!",
    contact_host: "Contact host",
    no_results: "No results found",
    back_to_guide: "Back to guide",
    language: "Language",
    wifi: "WiFi",
    checkout: "Checkout",
    your_stay_ok: "Is everything okay with your stay?",
    submit: "Submit",
    loading: "Loading…",
    powered_by: "Powered by StayGuide Pro",
  },
  DE: {
    search_placeholder: "Im Guide suchen…",
    all_topics: "Alle Themen",
    need_help: "Ich brauche Hilfe",
    ask_assistant: "Assistenten fragen",
    ask_placeholder: "Frag alles zu deinem Aufenthalt…",
    report_issue: "Problem melden",
    emergency: "Notfall",
    recommendations: "Empfehlungen",
    last_updated: "Zuletzt aktualisiert",
    send: "Senden",
    everything_good: "Alles bestens",
    report_problem: "Problem melden",
    thank_you: "Danke!",
    contact_host: "Gastgeber kontaktieren",
    no_results: "Keine Ergebnisse",
    back_to_guide: "Zurück zum Guide",
    language: "Sprache",
    wifi: "WLAN",
    checkout: "Check-out",
    your_stay_ok: "Ist alles in Ordnung mit deinem Aufenthalt?",
    submit: "Absenden",
    loading: "Lädt…",
    powered_by: "Bereitgestellt von StayGuide Pro",
  },
  IT: {
    need_help: "Ho bisogno di aiuto",
    report_issue: "Segnala un problema",
    emergency: "Emergenza",
    your_stay_ok: "Va tutto bene con il tuo soggiorno?",
    everything_good: "Tutto bene",
  },
  FR: {
    need_help: "J'ai besoin d'aide",
    report_issue: "Signaler un problème",
    emergency: "Urgence",
    your_stay_ok: "Tout se passe bien pendant votre séjour ?",
    everything_good: "Tout va bien",
  },
  NL: {
    need_help: "Ik heb hulp nodig",
    report_issue: "Probleem melden",
    emergency: "Noodgeval",
    your_stay_ok: "Is alles in orde met je verblijf?",
    everything_good: "Alles is goed",
  },
  ES: {
    need_help: "Necesito ayuda",
    report_issue: "Reportar un problema",
    emergency: "Emergencia",
    your_stay_ok: "¿Todo bien con tu estancia?",
    everything_good: "Todo bien",
  },
  TR: {
    need_help: "Yardıma ihtiyacım var",
    report_issue: "Sorun bildir",
    emergency: "Acil durum",
    your_stay_ok: "Konaklamanızda her şey yolunda mı?",
    everything_good: "Her şey yolunda",
  },
};

export function t(locale: Locale, key: UiKey): string {
  return DICT[locale]?.[key] ?? DICT.EN[key] ?? key;
}
