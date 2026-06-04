"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewRequestDialog } from "@/components/reviews/review-request-dialog";
import { type ReviewRequestWithRelations } from "@/server/reviews";
import { formatDate } from "@/lib/utils";

interface Props {
  request: ReviewRequestWithRelations;
  unresolvedIssues: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready to send",
  SENT: "Sent",
  COMPLETED: "Completed",
};

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "default" | "success"> = {
  DRAFT: "secondary",
  READY: "warning",
  SENT: "default",
  COMPLETED: "success",
};

export function ReviewRequestCard({ request, unresolvedIssues }: Props) {
  const [open, setOpen] = useState(false);

  const guestName = request.guestStay?.guestName ?? "Unknown guest";
  const checkIn = formatDate(request.guestStay?.checkIn);
  const checkOut = formatDate(request.guestStay?.checkOut);
  const status = request.status as string;
  const hasIssues = unresolvedIssues > 0;

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{guestName}</p>
              <Badge variant={STATUS_VARIANTS[status] ?? "secondary"} className="shrink-0">
                {STATUS_LABELS[status] ?? status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {request.property.publicName} · {checkIn} – {checkOut}
            </p>
            <div className="flex items-center gap-3">
              {request.privateFeedback && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Private note
                </span>
              )}
              {hasIssues && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  {unresolvedIssues} unresolved issue{unresolvedIssues === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open">
            <ChevronRight />
          </Button>
        </CardContent>
      </Card>

      <ReviewRequestDialog
        request={request}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
