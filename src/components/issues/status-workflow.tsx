"use client";

import { useActionState } from "react";
import type { IssueStatus } from "@prisma/client";
import { updateIssueStatus, type IssueActionState } from "@/server/issues";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ISSUE_STATUS_LABELS } from "@/components/issues/issue-status-badge";

const STATUS_FLOW: IssueStatus[] = [
  "NEW",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

interface StatusWorkflowProps {
  issueId: string;
  current: IssueStatus;
  canManage: boolean;
}

export function StatusWorkflow({ issueId, current, canManage }: StatusWorkflowProps) {
  const [state, formAction] = useActionState<IssueActionState, FormData>(
    updateIssueStatus,
    undefined,
  );

  const currentIndex = STATUS_FLOW.indexOf(current);
  const nextStatus = STATUS_FLOW[currentIndex + 1] as IssueStatus | undefined;
  const prevStatus =
    currentIndex > 0 ? (STATUS_FLOW[currentIndex - 1] as IssueStatus) : null;

  if (!canManage) {
    return (
      <div className="flex flex-wrap gap-2">
        {STATUS_FLOW.map((s, i) => (
          <span
            key={s}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              i < currentIndex && "bg-muted text-muted-foreground",
              i === currentIndex && "bg-primary text-primary-foreground",
              i > currentIndex && "bg-muted/40 text-muted-foreground opacity-50",
            )}
          >
            {ISSUE_STATUS_LABELS[s]}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_FLOW.map((s, i) => (
          <span
            key={s}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              i < currentIndex && "bg-muted text-muted-foreground",
              i === currentIndex && "bg-primary text-primary-foreground",
              i > currentIndex && "bg-muted/40 text-muted-foreground opacity-50",
            )}
          >
            {ISSUE_STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <form action={formAction}>
            <input type="hidden" name="issueId" value={issueId} />
            <input type="hidden" name="status" value={nextStatus} />
            <SubmitButton size="sm" pendingText="Updating…">
              Move to {ISSUE_STATUS_LABELS[nextStatus]}
            </SubmitButton>
          </form>
        )}

        {prevStatus && current !== "RESOLVED" && (
          <form action={formAction}>
            <input type="hidden" name="issueId" value={issueId} />
            <input type="hidden" name="status" value={prevStatus} />
            <SubmitButton size="sm" variant="outline" pendingText="Updating…">
              Back to {ISSUE_STATUS_LABELS[prevStatus]}
            </SubmitButton>
          </form>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </div>
  );
}
