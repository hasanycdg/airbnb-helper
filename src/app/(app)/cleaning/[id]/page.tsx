import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SprayCan } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { CleaningTaskDetail } from "@/components/cleaning/cleaning-task-detail";

export const metadata: Metadata = { title: "Cleaning Task" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CleaningTaskPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;

  const task = await db.cleaningTask.findFirst({
    where: { id, organizationId: orgId },
    include: {
      property: { select: { id: true, publicName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      inspectedBy: { select: { id: true, name: true } },
      items: { orderBy: [{ room: "asc" }, { order: "asc" }] },
    },
  });

  if (!task) notFound();

  // Load all org members (for reassign), properties inventory (for missing report)
  const [members, inventoryItems] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.inventoryItem.findMany({
      where: { propertyId: task.propertyId },
      select: { id: true, name: true, category: true, currentStatus: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const canManage = can(ctx.role, "cleaning:manage");
  const canComplete = can(ctx.role, "cleaning:complete");

  return (
    <>
      <PageHeader
        title={task.title ?? `${task.property.publicName} – Turnover`}
        description={`Property: ${task.property.publicName} · Status: ${task.status.replace("_", " ").toLowerCase()}`}
      />
      <CleaningTaskDetail
        task={task}
        members={members.map((m) => m.user)}
        inventoryItems={inventoryItems}
        canManage={canManage}
        canComplete={canComplete}
        currentUserId={ctx.user.id}
      />
    </>
  );
}
