"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createSectionAction } from "@/server/guide";
import { SECTION_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";

export function AddSectionDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("CUSTOM");
  const [state, formAction] = useActionState(createSectionAction, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add section
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a guide section</DialogTitle>
          <DialogDescription>Pick a topic template, or create a custom section.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="type" value={type} />
          <div className="space-y-2">
            <Label>Section type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((s) => (
                  <SelectItem key={s.type} value={s.type}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "CUSTOM" && (
            <div className="space-y-2">
              <Label htmlFor="title">Section title</Label>
              <Input id="title" name="title" placeholder="e.g. Rooftop terrace" />
            </div>
          )}
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end">
            <SubmitButton pendingText="Adding…">Add section</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
