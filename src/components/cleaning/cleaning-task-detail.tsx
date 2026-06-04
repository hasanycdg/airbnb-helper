"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import type { CleaningStatus, InventoryStatus } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CleaningStatusBadge } from "./cleaning-status-badge";
import { ChecklistSection } from "./checklist-section";
import { TaskStatusPanel } from "./task-status-panel";
import { DamageReportDialog } from "./damage-report-dialog";
import { MissingInventoryDialog } from "./missing-inventory-dialog";
import { TaskPhotoPanel } from "./task-photo-panel";
import {
  assignTask,
  setReadyForNextGuest,
} from "@/server/cleaning";

interface TaskItem {
  id: string;
  label: string;
  room: string | null;
  order: number;
  isDone: boolean;
  doneAt: Date | null;
  photoUrl: string | null;
  note: string | null;
}

interface CleaningTask {
  id: string;
  title: string | null;
  status: CleaningStatus;
  dueAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  inspectedAt: Date | null;
  readyForNextGuest: boolean;
  notes: string | null;
  photos: string[];
  property: { id: string; publicName: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  inspectedBy: { id: string; name: string | null } | null;
  items: TaskItem[];
}

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface InventoryItemRow {
  id: string;
  name: string;
  category: string | null;
  currentStatus: InventoryStatus;
}

interface CleaningTaskDetailProps {
  task: CleaningTask;
  members: Member[];
  inventoryItems: InventoryItemRow[];
  canManage: boolean;
  canComplete: boolean;
  currentUserId: string;
}

// Group items by room
function groupByRoom(items: TaskItem[]): Record<string, TaskItem[]> {
  return items.reduce<Record<string, TaskItem[]>>((acc, item) => {
    const room = item.room ?? "General";
    if (!acc[room]) acc[room] = [];
    acc[room].push(item);
    return acc;
  }, {});
}

export function CleaningTaskDetail({
  task,
  members,
  inventoryItems,
  canManage,
  canComplete,
  currentUserId: _currentUserId,
}: CleaningTaskDetailProps) {
  const { toast } = useToast();

  const total = task.items.length;
  const done = task.items.filter((i) => i.isDone).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const grouped = groupByRoom(task.items);
  const rooms = Object.keys(grouped).sort();

  // Assign action
  const [assignState, assignAction] = useActionState(assignTask, undefined);
  useEffect(() => {
    if (assignState?.success) toast({ title: "Assignee updated." });
    if (assignState?.error) toast({ title: "Error", description: assignState.error, variant: "destructive" });
  }, [assignState, toast]);

  // Ready action
  const [readyState, readyAction] = useActionState(setReadyForNextGuest, undefined);
  useEffect(() => {
    if (readyState?.success)
      toast({ title: task.readyForNextGuest ? "Marked as not ready." : "Marked ready for next guest!" });
    if (readyState?.error)
      toast({ title: "Error", description: readyState.error, variant: "destructive" });
  }, [readyState, task.readyForNextGuest, toast]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/cleaning">
            <ArrowLeft /> All tasks
          </Link>
        </Button>
      </div>

      {/* Overview card */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CleaningStatusBadge status={task.status} />
              {task.readyForNextGuest && (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Ready for guests
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {task.property.publicName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {formatDate(task.dueAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedTo?.name ?? task.assignedTo?.email ?? "Unassigned"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Checklist progress</span>
                <span className="tabular-nums text-muted-foreground">
                  {done}/{total} items
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}

          <Separator />

          {/* Timeline */}
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Started</p>
              <p>{formatDateTime(task.startedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <p>{formatDateTime(task.completedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inspected</p>
              <p>
                {formatDateTime(task.inspectedAt)}
                {task.inspectedBy?.name ? (
                  <span className="ml-1 text-muted-foreground">by {task.inspectedBy.name}</span>
                ) : null}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Checklist — left / main column */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-semibold">Checklist</h2>
          {total === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No checklist items for this task.
            </p>
          )}
          {rooms.map((room) => (
            <ChecklistSection
              key={room}
              room={room}
              items={grouped[room]}
              taskId={task.id}
              canComplete={canComplete}
            />
          ))}
        </div>

        {/* Right panel — actions & reports */}
        <div className="space-y-4">
          {/* Status transitions */}
          <TaskStatusPanel
            taskId={task.id}
            status={task.status}
            canManage={canManage}
            canComplete={canComplete}
          />

          {/* Ready for guest toggle */}
          {canComplete && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Guest readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={readyAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input
                    type="hidden"
                    name="ready"
                    value={task.readyForNextGuest ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    variant={task.readyForNextGuest ? "outline" : "success"}
                    className="w-full"
                  >
                    <CheckCircle2 />
                    {task.readyForNextGuest
                      ? "Mark as not ready"
                      : "Mark ready for next guest"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Assign */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assignee</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={assignAction} className="space-y-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <select
                    name="assignedToId"
                    defaultValue={task.assignedTo?.id ?? ""}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name ?? m.email}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    Update assignee
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Damage report */}
          {canComplete && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Report an issue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DamageReportDialog taskId={task.id} />
                {inventoryItems.length > 0 && (
                  <MissingInventoryDialog taskId={task.id} inventoryItems={inventoryItems} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Task proof photos */}
          <TaskPhotoPanel
            taskId={task.id}
            photos={task.photos}
            canComplete={canComplete}
          />
        </div>
      </div>
    </div>
  );
}
