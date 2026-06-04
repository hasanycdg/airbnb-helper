"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavIcon } from "@/components/app/nav-icons";
import { cn } from "@/lib/utils";

export interface PropertyTab {
  label: string;
  href: string;
  icon: string;
}

export function PropertyTabs({ tabs }: { tabs: PropertyTab[] }) {
  const pathname = usePathname();

  return (
    <div className="-mb-px flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const Icon = getNavIcon(tab.icon);
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
