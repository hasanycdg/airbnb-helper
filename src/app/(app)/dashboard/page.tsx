import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  MessageCircleQuestion,
  Package,
  SprayCan,
  TriangleAlert,
} from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { getT } from "@/lib/app-locale";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ISSUE_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;
  const t = await getT();

  const [
    propertyCount,
    openIssues,
    pendingCleaning,
    unansweredQuestions,
    lowInventory,
    recentIssues,
    upcomingCleaning,
  ] = await Promise.all([
    db.property.count({ where: { organizationId: orgId } }),
    db.issue.count({ where: { organizationId: orgId, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    db.cleaningTask.count({ where: { organizationId: orgId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    db.guestQuestion.count({ where: { property: { organizationId: orgId }, answered: false } }),
    db.inventoryItem.count({ where: { property: { organizationId: orgId }, currentStatus: { in: ["LOW", "EMPTY"] } } }),
    db.issue.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { property: { select: { publicName: true } } },
    }),
    db.cleaningTask.findMany({
      where: { organizationId: orgId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { dueAt: "asc" },
      take: 5,
      include: { property: { select: { publicName: true } }, assignedTo: { select: { name: true } } },
    }),
  ]);

  const plan = ctx.organization.subscription?.plan ?? "TRIAL";
  const firstName = ctx.user.name?.split(" ")[0] ?? "host";

  return (
    <>
      <PageHeader
        title={t("dash.welcome", { name: firstName })}
        description={t("dash.subtitle", { org: ctx.organization.name, plan: PLANS[plan].name })}
      >
        <Button asChild>
          <Link href="/properties">
            <Building2 /> {t("dash.manageProperties")}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dash.stat.properties")} value={propertyCount} icon={Building2} />
        <StatCard label={t("dash.stat.openIssues")} value={openIssues} icon={TriangleAlert} hint={t("dash.stat.openIssues.hint")} />
        <StatCard label={t("dash.stat.cleaning")} value={pendingCleaning} icon={SprayCan} hint={t("dash.stat.cleaning.hint")} />
        <StatCard label={t("dash.stat.questions")} value={unansweredQuestions} icon={MessageCircleQuestion} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("dash.recentIssues")}</CardTitle>
              <CardDescription>{t("dash.recentIssues.desc")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/issues">
                {t("common.viewAll")} <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentIssues.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("dash.noIssues")}</p>
            )}
            {recentIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{issue.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {issue.property.publicName} · {ISSUE_CATEGORY_LABELS[issue.category]}
                  </p>
                </div>
                <Badge variant={issue.status === "RESOLVED" || issue.status === "CLOSED" ? "secondary" : "warning"}>
                  {issue.status.toLowerCase().replace("_", " ")}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("dash.upcomingCleaning")}</CardTitle>
              <CardDescription>{t("dash.upcomingCleaning.desc")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cleaning">
                {t("common.viewAll")} <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingCleaning.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("dash.noCleaning")}</p>
            )}
            {upcomingCleaning.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.title ?? t("dash.turnover")}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.property.publicName}
                    {task.assignedTo?.name ? ` · ${task.assignedTo.name}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(task.dueAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {lowInventory > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Package className="h-5 w-5 text-warning" />
            <span>{t("dash.lowInventory", { count: lowInventory })}</span>
            <Button variant="ghost" size="sm" asChild className="ml-auto">
              <Link href="/inventory">{t("dash.review")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
