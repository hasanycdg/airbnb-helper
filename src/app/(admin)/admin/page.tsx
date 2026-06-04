import { BarChart3, Bot, Building2, CreditCard, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleSignupsButton } from "@/components/admin/toggle-signups-button";
import { getAdminOverviewStats } from "@/server/admin";
import type { SubscriptionStatus } from "@prisma/client";

function planBadgeVariant(
  status: SubscriptionStatus | "TRIALING",
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (status === "ACTIVE") return "success";
  if (status === "TRIALING") return "secondary";
  if (status === "PAST_DUE") return "warning";
  if (status === "CANCELED") return "destructive";
  return "outline";
}

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  const mrrEur = (stats.estimatedMrrCents / 100).toFixed(0);

  return (
    <>
      <PageHeader
        title="Platform Overview"
        description="Super-admin dashboard — platform-wide stats and controls."
      >
        <ToggleSignupsButton initialEnabled={stats.signupsEnabled} />
      </PageHeader>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Organizations"
          value={stats.totalOrgs}
          icon={Building2}
        />
        <StatCard
          label="Users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          label="Properties"
          value={stats.totalProperties}
          icon={Building2}
          hint="All tenants combined"
        />
        <StatCard
          label="Active subscriptions"
          value={stats.activeSubscriptionCount}
          icon={CreditCard}
          hint="Non-trial, active/trialing"
        />
        <StatCard
          label="Est. MRR"
          value={`€${mrrEur}`}
          icon={BarChart3}
          hint="Sum of active non-trial plan prices"
        />
      </div>

      {/* AI usage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="AI answer logs"
          value={stats.aiAnswerLogs}
          icon={Bot}
          hint="Total AI responses generated"
        />
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">New signups</p>
              <p className="text-2xl font-semibold">
                {stats.signupsEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">Platform-wide signup access</p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                stats.signupsEnabled ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              }`}
            >
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent signups table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Members</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Properties</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrgs.map((org) => (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{org.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={planBadgeVariant(org.status as SubscriptionStatus)}>
                        {org.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{org.memberCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{org.propertyCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {org.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {stats.recentOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No organizations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
