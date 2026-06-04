"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import type { Locale } from "@prisma/client";
import { LOCALE_LABELS } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher({
  locales,
  current,
}: {
  locales: Locale[];
  current: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setLang(locale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", locale.toLowerCase());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-sm font-medium backdrop-blur outline-none">
        <Globe className="h-4 w-4" />
        {LOCALE_LABELS[current].flag} {current}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => setLang(locale)}
            className="cursor-pointer gap-2"
          >
            <span>{LOCALE_LABELS[locale].flag}</span>
            {LOCALE_LABELS[locale].native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
