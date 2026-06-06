"use client";

import { useActionState, useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { createTask } from "@/server/cleaning";

interface NewTaskDialogProps {
  properties: { id: string; publicName: string }[];
  templates: { id: string; name: string }[];
  members: { id: string; name: string | null; email: string }[];
}

// Radix Select item values can't be empty strings; use sentinels and normalize
// them back to "" in the submitted hidden inputs (so the server action is unchanged).
const NO_TEMPLATE = "none";
const UNASSIGNED = "unassigned";

export function NewTaskDialog({ properties, templates, members }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Controlled selects (useActionState can't capture Select values directly)
  const [propertyId, setPropertyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const [state, action] = useActionState(createTask, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Cleaning task created!" });
      setOpen(false);
      setPropertyId("");
      setTemplateId("");
      setAssignedToId("");
    }
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New cleaning task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New cleaning task</DialogTitle>
          <DialogDescription>
            Select a property, optionally a checklist template, assignee, and due date.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {/* Hidden inputs for select values */}
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="templateId" value={templateId === NO_TEMPLATE ? "" : templateId} />
          <input type="hidden" name="assignedToId" value={assignedToId === UNASSIGNED ? "" : assignedToId} />

          <div className="space-y-2">
            <Label htmlFor="new-task-property">Property *</Label>
            <Select value={propertyId} onValueChange={setPropertyId} required>
              <SelectTrigger id="new-task-property">
                <SelectValue placeholder="Select property…" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.publicName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-task-title">Task title (optional)</Label>
            <Input
              id="new-task-title"
              name="title"
              placeholder="e.g. Summer turnover, Saturday clean…"
            />
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="new-task-template">Checklist template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="new-task-template">
                  <SelectValue placeholder="No template (empty checklist)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE}>No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-task-assignee">Assign to</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger id="new-task-assignee">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-task-due">Due date</Label>
            <Input id="new-task-due" name="dueAt" type="datetime-local" />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Creating…" disabled={!propertyId}>
              Create task
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
