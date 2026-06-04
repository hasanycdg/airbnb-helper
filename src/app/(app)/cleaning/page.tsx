import type { Metadata } from "next";
import { Plus, SprayCan } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CleaningFilters } from "@/components/cleaning/cleaning-filters";
import { CleaningTable } from "@/components/cleaning/cleaning-table";
import { NewTaskDialog } from "@/components/cleaning/new-task-dialog";
import type { CleaningStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Cleaning & Turnover" };

interface PageProps {
  searchParams: Promise<{
    status?: string;
    propertyId?: string;
  }>;
}

export default async function CleaningPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;

  const validStatuses: CleaningStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"];
  const statusFilter =
    params.status && validStatuses.includes(params.status as CleaningStatus)
      ? (params.status as CleaningStatus)
      : undefined;
  const propertyFilter = params.propertyId || undefined;

  const [properties, templates, members, tasks, stats] = await Promise.all([
    db.property.findMany({
      where: { organizationId: orgId },
      select: { id: true, publicName: true },
      orderBy: { publicName: "asc" },
    }),
    db.cleaningChecklistTemplate.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.cleaningTask.findMany({
      where: {
        organizationId: orgId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(propertyFilter ? { propertyId: propertyFilter } : {}),
      },
      include: {
        property: { select: { id: true, publicName: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        items: { select: { id: true, isDone: true } },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    // Status counts for StatCards
    db.cleaningTask.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
  ]);

  const countByStatus: Record<CleaningStatus, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    INSPECTED: 0,
  };
  for (const row of stats) {
    countByStatus[row.status] = row._count.id;
  }

  const canManage = can(ctx.role, "cleaning:manage");

  return (
    <>
      <PageHeader
        title="Cleaning & Turnover"
        description="Manage turnover tasks, checklists, and proof photos."
      >
        {canManage && (
          <NewTaskDialog
            properties={properties}
            templates={templates}
            members={members.map((m) => m.user)}
          />
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={countByStatus.PENDING} icon={SprayCan} hint="Not started" />
        <StatCard
          label="In progress"
          value={countByStatus.IN_PROGRESS}
          icon={SprayCan}
          hint="Currently being cleaned"
        />
        <StatCard label="Completed" value={countByStatus.COMPLETED} icon={SprayCan} hint="Done, awaiting inspection" />
        <StatCard label="Inspected" value={countByStatus.INSPECTED} icon={SprayCan} hint="Quality checked" />
      </div>

      <CleaningFilters
        properties={properties}
        currentStatus={statusFilter}
        currentPropertyId={propertyFilter}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={SprayCan}
          title="No cleaning tasks"
          description={
            statusFilter || propertyFilter
              ? "No tasks match the current filters."
              : "Create your first turnover task to get started."
          }
          action={
            canManage ? (
              <NewTaskDialog
                properties={properties}
                templates={templates}
                members={members.map((m) => m.user)}
              />
            ) : undefined
          }
        />
      ) : (
        <CleaningTable tasks={tasks} />
      )}
    </>
  );
}
