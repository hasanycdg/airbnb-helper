import type { Metadata } from "next";
import { Suspense } from "react";
import type { IssueStatus } from "@prisma/client";
import { TriangleAlert, CheckCircle2, Clock, CircleDot } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { IssueCard, type IssueWithRelations } from "@/components/issues/issue-card";
import { IssueFilters } from "@/components/issues/issue-filters";

export const metadata: Metadata = { title: "Issues" };

interface PageProps {
  searchParams: Promise<{ status?: string; propertyId?: string }>;
}

export default async function IssuesPage({ searchParams }: PageProps) {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;

  if (!can(ctx.role, "issues:view")) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Access denied"
        description="You do not have permission to view issues."
      />
    );
  }

  const params = await searchParams;
  const statusFilter = params.status as IssueStatus | undefined;
  const propertyIdFilter = params.propertyId as string | undefined;

  // Load stat counts
  const [newCount, openCount, resolvedCount, closedCount, properties, issues] = await Promise.all([
    db.issue.count({ where: { organizationId: orgId, status: "NEW" } }),
    db.issue.count({
      where: {
        organizationId: orgId,
        status: { in: ["ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS"] },
      },
    }),
    db.issue.count({ where: { organizationId: orgId, status: "RESOLVED" } }),
    db.issue.count({ where: { organizationId: orgId, status: "CLOSED" } }),
    db.property.findMany({
      where: { organizationId: orgId },
      select: { id: true, publicName: true },
      orderBy: { publicName: "asc" },
    }),
    db.issue.findMany({
      where: {
        organizationId: orgId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(propertyIdFilter ? { propertyId: propertyIdFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, publicName: true } },
        assignedTo: { select: { id: true, name: true } },
        comments: { select: { id: true } },
      },
    }) as Promise<IssueWithRelations[]>,
  ]);

  return (
    <>
      <PageHeader
        title="Issues"
        description="Guest-reported problems and maintenance requests"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New" value={newCount} icon={CircleDot} hint="Awaiting acknowledgement" />
        <StatCard label="Open" value={openCount} icon={Clock} hint="Acknowledged / in progress" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} />
        <StatCard label="Closed" value={closedCount} />
      </div>

      <div className="space-y-4">
        <Suspense>
          <IssueFilters properties={properties} />
        </Suspense>

        {issues.length === 0 ? (
          <EmptyState
            icon={TriangleAlert}
            title="No issues found"
            description={
              statusFilter || propertyIdFilter
                ? "Try changing your filters."
                : "No guest issues have been reported yet."
            }
          />
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
