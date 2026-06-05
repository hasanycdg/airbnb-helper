// Host-app (dashboard) localization. Separate from the guest-guide i18n in
// `@/lib/i18n` (which localizes guest-facing content). This module is pure data
// + a translate() helper, so it is safe to import from BOTH client and server.
// Default app language is German; English is selectable via the user menu.

export const APP_LOCALES = ["de", "en"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export const DEFAULT_APP_LOCALE: AppLocale = "de";
export const APP_LOCALE_COOKIE = "sg_app_lang";

export const APP_LOCALE_LABELS: Record<AppLocale, string> = {
  de: "Deutsch",
  en: "English",
};

type Dict = Record<string, Record<AppLocale, string>>;

export const APP_MESSAGES: Dict = {
  // ── Navigation ──────────────────────────────────────────────
  "nav.dashboard": { de: "Übersicht", en: "Dashboard" },
  "nav.properties": { de: "Unterkünfte", en: "Properties" },
  "nav.group.guest": { de: "Gästeerlebnis", en: "Guest experience" },
  "nav.questions": { de: "Gästefragen", en: "Guest questions" },
  "nav.messages": { de: "Nachrichten", en: "Messages" },
  "nav.reviews": { de: "Bewertungen", en: "Reviews" },
  "nav.templates": { de: "Tirol-Vorlagen", en: "Tirol templates" },
  "nav.group.operations": { de: "Betrieb", en: "Operations" },
  "nav.issues": { de: "Probleme", en: "Issues" },
  "nav.cleaning": { de: "Reinigung", en: "Cleaning" },
  "nav.inventory": { de: "Inventar", en: "Inventory" },
  "nav.group.insights": { de: "Auswertungen", en: "Insights" },
  "nav.analytics": { de: "Statistiken", en: "Analytics" },
  "nav.group.settings": { de: "Einstellungen", en: "Settings" },
  "nav.team": { de: "Team", en: "Team" },
  "nav.billing": { de: "Abrechnung", en: "Billing" },
  "nav.organization": { de: "Organisation", en: "Organization" },

  // ── User menu ───────────────────────────────────────────────
  "user.account": { de: "Konto", en: "Account" },
  "user.profile": { de: "Profil", en: "Profile" },
  "user.logout": { de: "Abmelden", en: "Log out" },
  "user.language": { de: "Sprache", en: "Language" },

  // ── Org switcher ────────────────────────────────────────────
  "org.plan": { de: "{plan}-Tarif", en: "{plan} plan" },
  "org.fallback": { de: "Organisation", en: "Organization" },
  "org.organizations": { de: "Organisationen", en: "Organizations" },
  "org.new": { de: "Neue Organisation", en: "New organization" },

  // ── Common ──────────────────────────────────────────────────
  "common.draft": { de: "Entwurf", en: "Draft" },
  "common.published": { de: "Veröffentlicht", en: "Published" },
  "common.viewAll": { de: "Alle ansehen", en: "View all" },

  // ── Dashboard ───────────────────────────────────────────────
  "dash.welcome": { de: "Willkommen zurück, {name}", en: "Welcome back, {name}" },
  "dash.subtitle": { de: "{org} · {plan}-Tarif", en: "{org} · {plan} plan" },
  "dash.manageProperties": { de: "Unterkünfte verwalten", en: "Manage properties" },
  "dash.stat.properties": { de: "Unterkünfte", en: "Properties" },
  "dash.stat.openIssues": { de: "Offene Probleme", en: "Open issues" },
  "dash.stat.openIssues.hint": { de: "Noch nicht gelöst", en: "Not yet resolved" },
  "dash.stat.cleaning": { de: "Offene Reinigungen", en: "Cleaning to do" },
  "dash.stat.cleaning.hint": { de: "Ausstehend oder in Arbeit", en: "Pending or in progress" },
  "dash.stat.questions": { de: "Offene Fragen", en: "Unanswered questions" },
  "dash.recentIssues": { de: "Neueste Probleme", en: "Recent issues" },
  "dash.recentIssues.desc": { de: "Zuletzt gemeldete Gästeprobleme", en: "Latest guest-reported problems" },
  "dash.upcomingCleaning": { de: "Anstehende Reinigungen", en: "Upcoming cleaning" },
  "dash.upcomingCleaning.desc": { de: "Reinigungen, die Aufmerksamkeit brauchen", en: "Turnovers that need attention" },
  "dash.noIssues": { de: "Noch keine Probleme gemeldet.", en: "No issues reported yet." },
  "dash.noCleaning": { de: "Keine Reinigungen geplant.", en: "No cleaning tasks scheduled." },
  "dash.turnover": { de: "Reinigung", en: "Turnover" },
  "dash.lowInventory": {
    de: "{count} Inventarartikel gehen in deinen Unterkünften zur Neige.",
    en: "{count} inventory items running low across your properties.",
  },
  "dash.review": { de: "Ansehen", en: "Review" },
};

export function translate(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const entry = APP_MESSAGES[key];
  let str = entry ? entry[locale] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
