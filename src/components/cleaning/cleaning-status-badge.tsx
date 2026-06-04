import { Badge } from "@/components/ui/badge";
import type { CleaningStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  CleaningStatus,
  { label: string; variant: "secondary" | "warning" | "default" | "success" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "default" },
  INSPECTED: { label: "Inspected", variant: "success" },
};

export function CleaningStatusBadge({ status }: { status: CleaningStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
