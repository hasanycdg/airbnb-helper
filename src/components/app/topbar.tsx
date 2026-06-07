"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPinned, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks, type ClientNavGroup } from "@/components/app/nav-links";
import { OrgSwitcher, type OrgOption } from "@/components/app/org-switcher";
import { UserMenu } from "@/components/app/user-menu";

export function Topbar({
  groups,
  orgs,
  activeOrgId,
  planLabel,
  userName,
  userEmail,
  supportEmail,
}: {
  groups: ClientNavGroup[];
  orgs: OrgOption[];
  activeOrgId: string;
  planLabel: string;
  userName: string | null;
  userEmail: string;
  supportEmail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-5 mt-2">
            <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} planLabel={planLabel} />
          </div>
          <NavLinks groups={groups} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MapPinned className="h-4 w-4" />
        </span>
        StayGuide Pro
      </Link>

      <div className="flex-1" />
      <UserMenu name={userName} email={userEmail} supportEmail={supportEmail} />
    </header>
  );
}
