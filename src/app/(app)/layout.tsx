import { requireOrg } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { APP_NAV } from "@/lib/nav";
import { PLANS } from "@/lib/plans";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import type { ClientNavGroup } from "@/components/app/nav-links";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrg();
  const role = ctx.role;

  const groups: ClientNavGroup[] = APP_NAV.map((group) => ({
    label: group.label,
    items: group.items
      .filter((item) => !item.permission || can(role, item.permission))
      .map(({ label, href, icon, exact }) => ({ label, href, icon, exact })),
  })).filter((g) => g.items.length > 0);

  const orgs = ctx.user.memberships.map((m) => ({ id: m.organizationId, name: m.organization.name }));
  const plan = ctx.organization.subscription?.plan ?? "TRIAL";
  const planLabel = PLANS[plan].name;

  return (
    <div className="flex min-h-screen">
      <Sidebar groups={groups} orgs={orgs} activeOrgId={ctx.organization.id} planLabel={planLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          groups={groups}
          orgs={orgs}
          activeOrgId={ctx.organization.id}
          planLabel={planLabel}
          userName={ctx.user.name}
          userEmail={ctx.user.email}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
