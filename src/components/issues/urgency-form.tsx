"use client";

import { useActionState, useEffect } from "react";
import type { IssueUrgency } from "@prisma/client";
import { setUrgency, type IssueActionState } from "@/server/issues";
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
import { ISSUE_URGENCY_LABELS } from "@/components/issues/issue-status-badge";

const ALL_URGENCIES: IssueUrgency[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface UrgencyFormProps {
  issueId: string;
  currentUrgency: IssueUrgency;
}

export function UrgencyForm({ issueId, currentUrgency }: UrgencyFormProps) {
  const [state, formAction] = useActionState<IssueActionState, FormData>(
    setUrgency,
    undefined,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Urgency updated" });
    } else if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="issueId" value={issueId} />
      <Label htmlFor="urgency">Urgency</Label>
      <div className="flex gap-2">
        <Select name="urgency" defaultValue={currentUrgency}>
          <SelectTrigger id="urgency" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_URGENCIES.map((u) => (
              <SelectItem key={u} value={u}>
                {ISSUE_URGENCY_LABELS[u]}
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
