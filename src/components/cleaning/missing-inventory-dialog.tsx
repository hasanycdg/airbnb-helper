"use client";

import { useActionState, useEffect, useState } from "react";
import { Package } from "lucide-react";
import type { InventoryStatus } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { reportMissingInventory } from "@/server/cleaning";

interface InventoryItemRow {
  id: string;
  name: string;
  category: string | null;
  currentStatus: InventoryStatus;
}

export function MissingInventoryDialog({
  taskId,
  inventoryItems,
}: {
  taskId: string;
  inventoryItems: InventoryItemRow[];
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, action] = useActionState(reportMissingInventory, undefined);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"LOW" | "EMPTY">("LOW");

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Inventory status updated." });
      setOpen(false);
      setSelectedItemId("");
      setSelectedStatus("LOW");
    }
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <Package /> Report low / missing stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Report missing inventory</DialogTitle>
          <DialogDescription>
            Flag an item as low or empty. This will update the inventory status.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="inventoryItemId" value={selectedItemId} />
          <input type="hidden" name="status" value={selectedStatus} />

          <div className="space-y-2">
            <Label htmlFor="inv-item">Inventory item *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId} required>
              <SelectTrigger id="inv-item">
                <SelectValue placeholder="Select item…" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    {item.category ? ` (${item.category})` : ""}
                    {item.currentStatus !== "OK" ? ` — ${item.currentStatus.toLowerCase()}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-status">Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as "LOW" | "EMPTY")}
            >
              <SelectTrigger id="inv-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Running low</SelectItem>
                <SelectItem value="EMPTY">Empty / out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton
              pendingText="Saving…"
              variant="default"
              disabled={!selectedItemId}
            >
              Report
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
