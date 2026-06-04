import Link from "next/link";
import { MapPinned } from "lucide-react";
import { NavLinks, type ClientNavGroup } from "@/components/app/nav-links";
import { OrgSwitcher, type OrgOption } from "@/components/app/org-switcher";

export function Sidebar({
  groups,
  orgs,
  activeOrgId,
  planLabel,
}: {
  groups: ClientNavGroup[];
  orgs: OrgOption[];
  activeOrgId: string;
  planLabel: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 border-r bg-card px-3 py-4 md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MapPinned className="h-5 w-5" />
        </span>
        StayGuide Pro
      </Link>
      <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} planLabel={planLabel} />
      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        <NavLinks groups={groups} />
      </div>
    </aside>
  );
}
