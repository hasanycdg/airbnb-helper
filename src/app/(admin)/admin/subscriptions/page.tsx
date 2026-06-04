import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllSubscriptions } from "@/server/admin";
import { PLANS } from "@/lib/plans";
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

export default async function AdminSubscriptionsPage() {
  const subs = await getAllSubscriptions();

  const totalMrr = subs
    .filter((s) => s.status === "ACTIVE" && s.plan !== "TRIAL")
    .reduce((acc, s) => acc + (PLANS[s.plan as PlanTier]?.priceMonthly ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description={`${subs.length} subscription${subs.length === 1 ? "" : "s"} · Est. MRR: €${(totalMrr / 100).toFixed(0)}`}
      />

      {subs.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Subscriptions will appear here once organizations sign up for a plan."
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Price / mo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Period ends
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Stripe customer
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub) => {
                    const planDef = PLANS[sub.plan as PlanTier];
                    return (
                      <tr
                        key={sub.id}
                        className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{sub.orgName}</div>
                          <div className="text-xs text-muted-foreground">{sub.orgSlug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={planBadgeVariant(sub.plan as PlanTier)}>
                            {planDef?.name ?? sub.plan}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Badge variant={statusBadgeVariant(sub.status as SubscriptionStatus)}>
                              {sub.status}
                            </Badge>
                            {sub.cancelAtPeriodEnd && (
                              <Badge variant="warning">Cancels</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {planDef ? `€${(planDef.priceMonthly / 100).toFixed(0)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sub.currentPeriodEnd
                            ? sub.currentPeriodEnd.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {sub.stripeCustomerId ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {sub.stripeCustomerId}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sub.createdAt.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
