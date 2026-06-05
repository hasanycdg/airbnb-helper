"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { APP_LOCALE_COOKIE, APP_LOCALES } from "@/lib/app-i18n";

/** Persist the host-app language preference (cookie) and re-render. */
export async function setAppLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale"));
  if (!(APP_LOCALES as readonly string[]).includes(locale)) return;
  const store = await cookies();
  store.set(APP_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
