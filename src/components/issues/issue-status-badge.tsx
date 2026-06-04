import type { IssueStatus, IssueUrgency } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const ISSUE_URGENCY_LABELS: Record<IssueUrgency, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline";

const STATUS_VARIANTS: Record<IssueStatus, BadgeVariant> = {
  NEW: "default",
  ACKNOWLEDGED: "warning",
  ASSIGNED: "warning",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const URGENCY_VARIANTS: Record<IssueUrgency, BadgeVariant> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "warning",
  URGENT: "destructive",
};

export function IssueStatusBadge({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={cn(className)}>
      {ISSUE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function IssueUrgencyBadge({
  urgency,
  className,
}: {
  urgency: IssueUrgency;
  className?: string;
}) {
  return (
    <Badge variant={URGENCY_VARIANTS[urgency]} className={cn(className)}>
      {ISSUE_URGENCY_LABELS[urgency]}
    </Badge>
  );
}
