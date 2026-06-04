import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { getAllOrganizations } from "@/server/admin";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

function planBadgeVariant(
  plan: PlanTier,
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (plan === "MANAGER") return "default";
  if (plan === "PREMIUM") return "success";
  if (plan === "PRO") return "secondary";
  if (plan === "STARTER") return "outline";
  return "outline";
}

function statusBadgeVariant(
  status: SubscriptionStatus,
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (status === "ACTIVE") return "success";
  if (status === "TRIALING") return "secondary";
  if (status === "PAST_DUE") return "warning";
  if (status === "CANCELED") return "destructive";
  return "outline";
}

export default async function AdminOrganizationsPage() {
  const orgs = await getAllOrganizations();

  return (
    <>
      <PageHeader
        title="Organizations"
        description={`${orgs.length} organization${orgs.length === 1 ? "" : "s"} on the platform.`}
      />

      {/* Impersonate caveat */}
      <div className="rounded-lg border border-warning bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        <strong>Support access notice:</strong> Using &quot;Impersonate&quot; grants you OWNER access to that
        organization. This action is audited and creates a membership record documenting the access.
        Use only for legitimate support purposes.
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Organizations appear here as users sign up."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Organization
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Members
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Properties
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={planBadgeVariant(org.plan as PlanTier)}>
                          {org.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(org.status as SubscriptionStatus)}>
                          {org.status}
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
                      <td className="px-4 py-3 text-right">
                        <ImpersonateButton organizationId={org.id} orgName={org.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
