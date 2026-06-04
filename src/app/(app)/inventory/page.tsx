import { Package } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryClient } from "@/components/inventory/inventory-client";
import { requireOrg } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const { organization, role } = await requireOrg();
  const { propertyId: qsPropertyId } = await searchParams;

  const canManage = can(role, "inventory:manage");
  const canReport = can(role, "inventory:report");

  // Load all properties for this org (for the property selector)
  const properties = await db.property.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true, publicName: true },
    orderBy: { name: "asc" },
  });

  // Default to the first property if none selected
  const selectedPropertyId =
    (qsPropertyId && properties.find((p) => p.id === qsPropertyId)?.id) ||
    properties[0]?.id;

  // If no properties exist, show an appropriate empty screen
  if (!selectedPropertyId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Track supplies and manage restocking for your properties."
        />
        <p className="text-sm text-muted-foreground">
          No properties found. Create a property first to start tracking inventory.
        </p>
      </div>
    );
  }

  // Load items and open restock tasks for the selected property
  const [items, restockTasks] = await Promise.all([
    db.inventoryItem.findMany({
      where: { propertyId: selectedPropertyId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.restockTask.findMany({
      where: {
        propertyId: selectedPropertyId,
      },
      include: {
        inventoryItem: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const openTaskCount = restockTasks.filter((t) => t.status !== "DONE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={
          openTaskCount > 0
            ? `${openTaskCount} open restock task${openTaskCount !== 1 ? "s" : ""} need attention.`
            : "Track supplies and manage restocking for your properties."
        }
      />

      <InventoryClient
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        items={items}
        restockTasks={restockTasks}
        canManage={canManage}
        canReport={canReport}
      />
    </div>
  );
}
