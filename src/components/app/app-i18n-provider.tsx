"use client";

import { createContext, useContext } from "react";
import { translate, type AppLocale } from "@/lib/app-i18n";

const AppLocaleContext = createContext<AppLocale>("de");

export function AppI18nProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  return <AppLocaleContext.Provider value={locale}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale(): AppLocale {
  return useContext(AppLocaleContext);
}

/** Client-side translate hook bound to the current app locale. */
export function useT() {
  const locale = useContext(AppLocaleContext);
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
