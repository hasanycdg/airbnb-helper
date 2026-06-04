"use client";

import Link from "next/link";
import { Building, Check, ChevronsUpDown, Plus } from "lucide-react";
import { switchOrganizationAction } from "@/server/auth-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface OrgOption {
  id: string;
  name: string;
}

export function OrgSwitcher({
  orgs,
  activeOrgId,
  planLabel,
}: {
  orgs: OrgOption[];
  activeOrgId: string;
  planLabel: string;
}) {
  const active = orgs.find((o) => o.id === activeOrgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate">
          <span className="block truncate font-medium">{active?.name ?? "Organization"}</span>
          <span className="block truncate text-xs text-muted-foreground">{planLabel} plan</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {orgs.map((org) => (
          <form action={switchOrganizationAction} key={org.id}>
            <input type="hidden" name="organizationId" value={org.id} />
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer">
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === activeOrgId && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </button>
          </form>
        ))}
        <DropdownMenuSeparator />
        <Link href="/onboarding">
          <DropdownMenuItem className={cn("cursor-pointer")}>
            <Plus className="mr-2" /> New organization
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
