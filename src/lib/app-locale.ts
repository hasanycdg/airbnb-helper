import "server-only";
import { cookies } from "next/headers";
import {
  APP_LOCALE_COOKIE,
  APP_LOCALES,
  DEFAULT_APP_LOCALE,
  translate,
  type AppLocale,
} from "@/lib/app-i18n";

/** Resolve the host-app language from the cookie (defaults to German). */
export async function getAppLocale(): Promise<AppLocale> {
  const store = await cookies();
  const value = store.get(APP_LOCALE_COOKIE)?.value;
  return value && (APP_LOCALES as readonly string[]).includes(value)
    ? (value as AppLocale)
    : DEFAULT_APP_LOCALE;
}

/** Returns a translate function bound to the current app locale, for server components. */
export async function getT() {
  const locale = await getAppLocale();
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
