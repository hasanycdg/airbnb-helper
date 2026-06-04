"use client";

import { useActionState, useEffect, useState } from "react";
import { FileWarning } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";
import { reportDamage } from "@/server/cleaning";

export function DamageReportDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, action] = useActionState(reportDamage, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Damage report created. An issue has been logged." });
      setOpen(false);
    }
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <FileWarning /> Report damage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Report damage</DialogTitle>
          <DialogDescription>
            This will create a "Broken item" issue linked to this property.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="taskId" value={taskId} />

          <div className="space-y-2">
            <Label htmlFor="damage-title">What is damaged? *</Label>
            <Input
              id="damage-title"
              name="title"
              placeholder="e.g. Broken chair leg in living room"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="damage-room">Room / location</Label>
            <Input
              id="damage-room"
              name="roomLocation"
              placeholder="e.g. Bedroom 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="damage-description">Additional details</Label>
            <Textarea
              id="damage-description"
              name="description"
              rows={3}
              placeholder="Describe the damage…"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Reporting…" variant="destructive">
              Report damage
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
