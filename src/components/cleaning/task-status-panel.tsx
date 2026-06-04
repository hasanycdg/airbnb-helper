"use client";

import { useActionState, useEffect } from "react";
import { CheckCheck, Play, RotateCcw, Shield } from "lucide-react";
import type { CleaningStatus } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CleaningStatusBadge } from "./cleaning-status-badge";
import { setTaskStatus } from "@/server/cleaning";

interface TaskStatusPanelProps {
  taskId: string;
  status: CleaningStatus;
  canManage: boolean;
  canComplete: boolean;
}

export function TaskStatusPanel({
  taskId,
  status,
  canManage,
  canComplete,
}: TaskStatusPanelProps) {
  const { toast } = useToast();
  const [state, action] = useActionState(setTaskStatus, undefined);

  useEffect(() => {
    if (state?.success) toast({ title: "Task status updated." });
    if (state?.error) toast({ title: "Error", description: state.error, variant: "destructive" });
  }, [state, toast]);

  const setStatus = (nextStatus: CleaningStatus) => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("status", nextStatus);
    // Use startTransition-style — just call action directly via form
    return fd;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Task status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mb-2">
          <CleaningStatusBadge status={status} />
        </div>

        {canComplete && status === "PENDING" && (
          <form action={action}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <Button type="submit" variant="default" className="w-full" size="sm">
              <Play /> Start cleaning
            </Button>
          </form>
        )}

        {canComplete && status === "IN_PROGRESS" && (
          <form action={action}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="COMPLETED" />
            <Button type="submit" variant="success" className="w-full" size="sm">
              <CheckCheck /> Mark completed
            </Button>
          </form>
        )}

        {canManage && status === "COMPLETED" && (
          <form action={action}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="INSPECTED" />
            <Button type="submit" variant="default" className="w-full" size="sm">
              <Shield /> Mark inspected
            </Button>
          </form>
        )}

        {canManage && (status === "IN_PROGRESS" || status === "COMPLETED") && (
          <form action={action}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="PENDING" />
            <Button type="submit" variant="outline" className="w-full" size="sm">
              <RotateCcw /> Reset to pending
            </Button>
          </form>
        )}

        {status === "INSPECTED" && (
          <p className="text-xs text-muted-foreground">
            This task has been fully inspected and is complete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
