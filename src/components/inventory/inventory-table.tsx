"use client";

import { useTransition } from "react";
import type { InventoryItem } from "@prisma/client";
import { CheckCircle2, AlertTriangle, XCircle, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { setItemStatus, deleteItem, createRestockTask } from "@/server/inventory";

interface InventoryTableProps {
  items: InventoryItem[];
  canReport: boolean;
  canManage: boolean;
  onEdit: (item: InventoryItem) => void;
}

const STATUS_META = {
  OK: {
    label: "OK",
    variant: "success" as const,
    Icon: CheckCircle2,
  },
  LOW: {
    label: "Low",
    variant: "warning" as const,
    Icon: AlertTriangle,
  },
  EMPTY: {
    label: "Empty",
    variant: "destructive" as const,
    Icon: XCircle,
  },
};

export function InventoryTable({
  items,
  canReport,
  canManage,
  onEdit,
}: InventoryTableProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleSetStatus(itemId: string, status: "OK" | "LOW" | "EMPTY") {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("itemId", itemId);
      fd.append("status", status);
      await setItemStatus(fd);
      toast({
        title:
          status === "OK"
            ? "Marked as restocked"
            : status === "LOW"
              ? "Marked as low stock"
              : "Marked as empty",
      });
    });
  }

  function handleCreateTask(item: InventoryItem) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("propertyId", item.propertyId);
      fd.append("inventoryItemId", item.id);
      fd.append("title", `Restock: ${item.name}`);
      const result = await createRestockTask(undefined, fd);
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Restock task created" });
      }
    });
  }

  function handleDelete(itemId: string) {
    if (!confirm("Delete this inventory item?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("itemId", itemId);
      await deleteItem(fd);
      toast({ title: "Item deleted" });
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Qty</TableHead>
            <TableHead className="hidden md:table-cell">Threshold</TableHead>
            <TableHead className="hidden lg:table-cell">Last restocked</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const meta = STATUS_META[item.currentStatus];
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  {item.unit && (
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {item.category ? (
                    <span className="text-sm text-muted-foreground">{item.category}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={meta.variant} className="gap-1">
                    <meta.Icon className="h-3 w-3" />
                    {meta.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.quantity != null ? (
                    <span className="tabular-nums">{item.quantity}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.threshold != null ? (
                    <span className="tabular-nums">{item.threshold}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {item.lastRestockedAt ? (
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.lastRestockedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {canReport && (
                      <>
                        {item.currentStatus !== "OK" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={isPending}
                            onClick={() => handleSetStatus(item.id, "OK")}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Restocked</span>
                          </Button>
                        )}
                        {item.currentStatus !== "LOW" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={isPending}
                            onClick={() => handleSetStatus(item.id, "LOW")}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Low</span>
                          </Button>
                        )}
                        {item.currentStatus !== "EMPTY" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={isPending}
                            onClick={() => handleSetStatus(item.id, "EMPTY")}
                          >
                            <XCircle className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Empty</span>
                          </Button>
                        )}
                        {(item.currentStatus === "LOW" || item.currentStatus === "EMPTY") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={isPending}
                            onClick={() => handleCreateTask(item)}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Restock task</span>
                          </Button>
                        )}
                      </>
                    )}
                    {canManage && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={isPending}
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
