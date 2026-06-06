"use client";

import { useActionState, useEffect } from "react";
import { assignIssue, type IssueActionState } from "@/server/issues";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
}

interface AssignFormProps {
  issueId: string;
  currentAssigneeId: string | null;
  members: TeamMember[];
}

// Radix Select forbids an empty-string item value (it's reserved for "cleared").
const UNASSIGNED = "unassigned";

export function AssignForm({ issueId, currentAssigneeId, members }: AssignFormProps) {
  const [state, formAction] = useActionState<IssueActionState, FormData>(
    assignIssue,
    undefined,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Assignee updated" });
    } else if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="issueId" value={issueId} />
      <Label htmlFor="assignedToId">Assign to</Label>
      <div className="flex gap-2">
        <Select name="assignedToId" defaultValue={currentAssigneeId ?? UNASSIGNED}>
          <SelectTrigger id="assignedToId" className="flex-1">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name ?? m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SubmitButton size="sm" variant="outline" pendingText="Saving…">
          Save
        </SubmitButton>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
