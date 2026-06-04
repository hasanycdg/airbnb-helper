import type { Metadata } from "next";
import { CreditCard, FlaskConical, Users, Building2, BotMessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PLANS } from "@/lib/plans";
import { getOrgUsage } from "@/lib/usage";
import { billingMode } from "@/lib/stripe";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanCards } from "@/components/billing/plan-cards";
import { UsageBar } from "@/components/billing/usage-bar";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";

export const metadata: Metadata = { title: "Billing" };

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function subscriptionStatusBadge(
  status: string | undefined,
): { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "TRIALING":
      return { label: "Trial", variant: "secondary" };
    case "PAST_DUE":
      return { label: "Past due", variant: "warning" };
    case "CANCELED":
      return { label: "Canceled", variant: "destructive" };
    case "INCOMPLETE":
      return { label: "Incomplete", variant: "warning" };
    default:
      return { label: "Unknown", variant: "secondary" };
  }
}

export default async function BillingPage() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const canManage = can(ctx.role, "billing:manage");

  const subscription = ctx.organization.subscription;
  const currentPlan = subscription?.plan ?? "TRIAL";
  const planDef = PLANS[currentPlan];

  const trialEndsAt = ctx.organization.trialEndsAt;
  const renewalDate = subscription?.currentPeriodEnd;
  const isCanceling = subscription?.cancelAtPeriodEnd ?? false;

  const usage = await getOrgUsage(ctx.organization.id, currentPlan);
  const statusBadge = subscriptionStatusBadge(subscription?.status);
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);

  return (
    <>
      <PageHeader
        title="Billing & Plan"
        description="Manage your subscription and review usage limits."
      >
        {canManage && hasStripeCustomer && <ManageBillingButton />}
      </PageHeader>

      {/* Mock mode banner */}
      {billingMode === "mock" && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <FlaskConical className="h-4 w-4 shrink-0 text-warning" />
          <span>
            <strong>Demo mode:</strong> Stripe is not configured. Plan changes are applied instantly
            without real payments.
          </span>
        </div>
      )}

      {/* Current subscription overview */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Current subscription
            </CardTitle>
            <CardDescription>Your active plan and billing cycle.</CardDescription>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className="font-semibold">{planDef.name}</p>
              <p className="text-xs text-muted-foreground">{planDef.tagline}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {currentPlan === "TRIAL" ? "Trial ends" : isCanceling ? "Cancels on" : "Renews on"}
              </p>
              <p className="font-semibold">
                {currentPlan === "TRIAL"
                  ? formatDate(trialEndsAt)
                  : formatDate(renewalDate)}
              </p>
              {isCanceling && (
                <p className="text-xs text-warning">Will not renew automatically.</p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</p>
              <p className="font-semibold">
                {planDef.priceMonthly === 0
                  ? "Free"
                  : `€${(planDef.priceMonthly / 100).toFixed(0)} / month`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Your current usage vs. the limits on the <strong>{planDef.name}</strong> plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageBar
            label="Properties"
            used={usage.properties.used}
            limit={usage.properties.limit}
            unit="properties"
          />
          <UsageBar
            label="Team members"
            used={usage.teamMembers.used}
            limit={usage.teamMembers.limit}
            unit="members"
          />
          <UsageBar
            label="AI messages this month"
            used={usage.aiMessages.used}
            limit={usage.aiMessages.limit}
            unit="messages"
          />
        </CardContent>
      </Card>

      {/* Plan comparison */}
      {canManage && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Change plan</h2>
            <p className="text-sm text-muted-foreground">
              Upgrade or downgrade at any time. Changes take effect immediately.
            </p>
          </div>
          <PlanCards currentPlan={currentPlan} />
        </div>
      )}

      {/* Stat cards for a quick visual overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Properties</p>
              <p className="text-xl font-semibold tabular-nums">
                {usage.properties.used}
                {usage.properties.limit !== null && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ {usage.properties.limit}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team members</p>
              <p className="text-xl font-semibold tabular-nums">
                {usage.teamMembers.used}
                {usage.teamMembers.limit !== null && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ {usage.teamMembers.limit}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
              <BotMessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI messages (month)</p>
              <p className="text-xl font-semibold tabular-nums">
                {usage.aiMessages.used}
                {usage.aiMessages.limit !== null && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ {usage.aiMessages.limit === 0 ? "N/A" : usage.aiMessages.limit}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
