"use client";

import { useActionState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { addItem, updateItem, type InventoryState } from "@/server/inventory";
import type { InventoryItem } from "@prisma/client";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  editItem?: InventoryItem | null;
}

export function AddItemDialog({
  open,
  onOpenChange,
  propertyId,
  editItem,
}: AddItemDialogProps) {
  const { toast } = useToast();
  const isEditing = Boolean(editItem);

  const action = isEditing ? updateItem : addItem;
  const [state, formAction] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: isEditing ? "Item updated" : "Item added" });
      onOpenChange(false);
    }
    if (state?.error) {
      toast({ title: state.error, variant: "destructive" });
    }
  }, [state, isEditing, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit item" : "Add inventory item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this inventory item."
              : "Add a new item to track for this property."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Hidden ids */}
          <input type="hidden" name="propertyId" value={propertyId} />
          {isEditing && <input type="hidden" name="itemId" value={editItem!.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={100}
              defaultValue={editItem?.name ?? ""}
              placeholder="e.g. Toilet paper"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                maxLength={60}
                defaultValue={editItem?.category ?? ""}
                placeholder="e.g. Bathroom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                maxLength={30}
                defaultValue={editItem?.unit ?? ""}
                placeholder="e.g. rolls"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Current qty</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={editItem?.quantity ?? ""}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Low-stock threshold</Label>
              <Input
                id="threshold"
                name="threshold"
                type="number"
                min="0"
                step="1"
                defaultValue={editItem?.threshold ?? ""}
                placeholder="e.g. 2"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton pendingText={isEditing ? "Saving…" : "Adding…"}>
              <PlusCircle className="h-4 w-4" />
              {isEditing ? "Save changes" : "Add item"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
