"use client";

import { useState, useTransition } from "react";
import type { InventoryItem, RestockTask, Property } from "@prisma/client";
import {
  Package,
  PlusCircle,
  Sprout,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { PropertySelector } from "@/components/inventory/property-selector";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddItemDialog } from "@/components/inventory/add-item-dialog";
import { RestockTasksPanel } from "@/components/inventory/restock-tasks-panel";
import { seedDefaults } from "@/server/inventory";

type RestockTaskWithItem = RestockTask & {
  inventoryItem: InventoryItem | null;
};

interface InventoryClientProps {
  properties: Pick<Property, "id" | "name" | "publicName">[];
  selectedPropertyId: string;
  items: InventoryItem[];
  restockTasks: RestockTaskWithItem[];
  canManage: boolean;
  canReport: boolean;
}

export function InventoryClient({
  properties,
  selectedPropertyId,
  items,
  restockTasks,
  canManage,
  canReport,
}: InventoryClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const okCount = items.filter((i) => i.currentStatus === "OK").length;
  const lowCount = items.filter((i) => i.currentStatus === "LOW").length;
  const emptyCount = items.filter((i) => i.currentStatus === "EMPTY").length;
  const openTaskCount = restockTasks.filter((t) => t.status !== "DONE").length;

  function handleEdit(item: InventoryItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  function handleOpenAdd() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function handleSeedDefaults() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("propertyId", selectedPropertyId);
      await seedDefaults(fd);
      toast({ title: "Default inventory items seeded" });
    });
  }

  return (
    <div className="space-y-6">
      {/* Property selector + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PropertySelector
          properties={properties}
          selectedId={selectedPropertyId}
        />
        <div className="flex flex-wrap items-center gap-2">
          {canManage && items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={isPending}
            >
              <Sprout className="h-4 w-4" />
              Seed defaults
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={handleOpenAdd}>
              <PlusCircle className="h-4 w-4" />
              Add item
            </Button>
          )}
        </div>
      </div>

      {/* Summary stat cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total items"
            value={items.length}
            icon={Package}
            hint="tracked across this property"
          />
          <StatCard
            label="OK"
            value={okCount}
            icon={CheckCircle2}
            className="[&_.h-11]:bg-success/15 [&_.h-11]:text-success"
          />
          <StatCard
            label="Low stock"
            value={lowCount}
            icon={AlertTriangle}
            className="[&_.h-11]:bg-warning/15 [&_.h-11]:text-warning"
          />
          <StatCard
            label="Empty"
            value={emptyCount}
            icon={XCircle}
            className="[&_.h-11]:bg-destructive/15 [&_.h-11]:text-destructive"
          />
        </div>
      )}

      {/* Inventory table */}
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No inventory items yet"
          description={
            canManage
              ? "Add items to track supplies for this property, or seed the default list."
              : "No inventory items have been added to this property yet."
          }
          action={
            canManage ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={handleSeedDefaults} disabled={isPending}>
                  <Sprout className="h-4 w-4" />
                  Seed defaults
                </Button>
                <Button size="sm" onClick={handleOpenAdd}>
                  <PlusCircle className="h-4 w-4" />
                  Add item
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <InventoryTable
          items={items}
          canReport={canReport}
          canManage={canManage}
          onEdit={handleEdit}
        />
      )}

      {/* Restock tasks */}
      {(restockTasks.length > 0 || canManage) && (
        <RestockTasksPanel tasks={restockTasks} canComplete={canReport} />
      )}

      {/* Add / edit dialog */}
      <AddItemDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        propertyId={selectedPropertyId}
        editItem={editItem}
      />
    </div>
  );
}
