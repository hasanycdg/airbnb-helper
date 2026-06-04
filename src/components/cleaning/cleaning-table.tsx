import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import type { CleaningStatus } from "@prisma/client";
import { cn, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CleaningStatusBadge } from "./cleaning-status-badge";

interface TaskRow {
  id: string;
  title: string | null;
  status: CleaningStatus;
  dueAt: Date | null;
  readyForNextGuest: boolean;
  property: { id: string; publicName: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  items: { id: string; isDone: boolean }[];
}

export function CleaningTable({ tasks }: { tasks: TaskRow[] }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property / Title</TableHead>
            <TableHead className="hidden sm:table-cell">Assignee</TableHead>
            <TableHead className="hidden md:table-cell">Due</TableHead>
            <TableHead className="hidden lg:table-cell">Progress</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Ready</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const total = task.items.length;
            const done = task.items.filter((i) => i.isDone).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <TableRow key={task.id} className="cursor-pointer hover:bg-accent/40">
                <TableCell>
                  <Link href={`/cleaning/${task.id}`} className="block min-w-0">
                    <span className="font-medium">
                      {task.title ?? `${task.property.publicName} Turnover`}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                      {task.property.publicName}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                      {task.assignedTo?.name ?? task.assignedTo?.email ?? "Unassigned"}
                    </span>
                    {/* Mobile status */}
                    <span className="mt-1 block sm:hidden">
                      <CleaningStatusBadge status={task.status} />
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {task.assignedTo?.name ?? task.assignedTo?.email ?? (
                    <span className="italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  <span
                    className={cn(
                      task.dueAt && new Date(task.dueAt) < new Date() && task.status !== "INSPECTED"
                        ? "text-destructive font-medium"
                        : "",
                    )}
                  >
                    {formatDate(task.dueAt)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {total > 0 ? (
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 w-20" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {done}/{total}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No items</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <CleaningStatusBadge status={task.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.readyForNextGuest ? (
                    <Badge variant="success">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" /> Not ready
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
