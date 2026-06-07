"use client";

import Link from "next/link";
import { Check, Globe, LogOut, User as UserIcon } from "lucide-react";
import { logoutAction } from "@/server/auth-actions";
import { setAppLocaleAction } from "@/server/preferences";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { useAppLocale, useT } from "@/components/app/app-i18n-provider";
import { APP_LOCALES, APP_LOCALE_LABELS } from "@/lib/app-i18n";

export function UserMenu({ name, email }: { name: string | null; email: string }) {
  const t = useT();
  const locale = useAppLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials(name ?? email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name ?? t("user.account")}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/settings/profile">
            <UserIcon className="mr-2" /> {t("user.profile")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Globe className="h-3.5 w-3.5" /> {t("user.language")}
        </DropdownMenuLabel>
        {APP_LOCALES.map((loc) => (
          <form action={setAppLocaleAction} key={loc}>
            <input type="hidden" name="locale" value={loc} />
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer">
                <span className="flex-1">{APP_LOCALE_LABELS[loc]}</span>
                {loc === locale && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </button>
          </form>
        ))}

        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2" /> {t("user.logout")}
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
