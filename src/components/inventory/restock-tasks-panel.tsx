"use client";

import { useTransition } from "react";
import type { RestockTask, InventoryItem } from "@prisma/client";
import { CheckCircle2, ClipboardList, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { completeRestockTask } from "@/server/inventory";
import { cn } from "@/lib/utils";

type RestockTaskWithItem = RestockTask & {
  inventoryItem: InventoryItem | null;
};

interface RestockTasksPanelProps {
  tasks: RestockTaskWithItem[];
  canComplete: boolean;
}

const STATUS_META = {
  PENDING: { label: "Pending", variant: "warning" as const },
  IN_PROGRESS: { label: "In progress", variant: "secondary" as const },
  DONE: { label: "Done", variant: "success" as const },
};

export function RestockTasksPanel({ tasks, canComplete }: RestockTasksPanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const openTasks = tasks.filter((t) => t.status !== "DONE");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  function handleComplete(taskId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("taskId", taskId);
      await completeRestockTask(fd);
      toast({ title: "Restock task completed" });
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Restock tasks
          {openTasks.length > 0 && (
            <Badge variant="warning" className="ml-1 tabular-nums">
              {openTasks.length} open
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {openTasks.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No open restock tasks"
            description="When items run low you can create restock tasks from the table above."
            className="py-8"
          />
        ) : (
          <ul className="space-y-2">
            {openTasks.map((task) => {
              const meta = STATUS_META[task.status];
              return (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.inventoryItem && (
                      <p className="text-xs text-muted-foreground">
                        {task.inventoryItem.name}
                        {task.inventoryItem.category
                          ? ` · ${task.inventoryItem.category}`
                          : ""}
                      </p>
                    )}
                    {task.note && (
                      <p className="text-xs text-muted-foreground">{task.note}</p>
                    )}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Badge variant={meta.variant} className="text-[10px]">
                        {meta.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {canComplete && task.status !== "DONE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 gap-1 px-2 text-xs"
                      disabled={isPending}
                      onClick={() => handleComplete(task.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {doneTasks.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
              {doneTasks.length} completed task{doneTasks.length !== 1 ? "s" : ""}
            </summary>
            <ul className="mt-2 space-y-2">
              {doneTasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm line-through">{task.title}</p>
                    {task.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Done {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="success" className="text-[10px]">Done</Badge>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
