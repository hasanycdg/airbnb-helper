"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CreditCard,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: BarChart3, exact: true },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, exact: false },
  { label: "Users", href: "/admin/users", icon: Users, exact: false },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, exact: false },
  { label: "Audit Logs", href: "/admin/logs", icon: ScrollText, exact: false },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 border-r bg-card px-3 py-4 md:flex">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">StayGuide Pro</span>
          <span className="text-xs text-muted-foreground">Platform Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to app
      </Link>
    </aside>
  );
}
