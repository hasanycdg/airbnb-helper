"use client";

import { useEffect, useState, useActionState } from "react";
import { AlertTriangle, Bot, CheckCircle, Loader2, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import {
  generateDrafts,
  saveDrafts,
  savePrivateFeedback,
  markSent,
  markCompleted,
  type ReviewRequestWithRelations,
  type ReviewActionState,
} from "@/server/reviews";
import { formatDate } from "@/lib/utils";

interface Props {
  request: ReviewRequestWithRelations;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SENT: "Sent",
  COMPLETED: "Completed",
};

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "default" | "success"> = {
  DRAFT: "secondary",
  READY: "warning",
  SENT: "default",
  COMPLETED: "success",
};

export function ReviewRequestDialog({ request, open, onOpenChange }: Props) {
  const { toast } = useToast();

  const [draftMessage, setDraftMessage] = useState(request.draftMessage ?? "");
  const [hostReview, setHostReview] = useState(request.hostReviewDraft ?? "");
  const [privateFeedback, setPrivateFeedback] = useState(request.privateFeedback ?? "");
  const [isGenerating, setIsGenerating] = useState(false);

  // Keep state in sync when request prop changes (e.g. after revalidation).
  useEffect(() => {
    setDraftMessage(request.draftMessage ?? "");
    setHostReview(request.hostReviewDraft ?? "");
    setPrivateFeedback(request.privateFeedback ?? "");
  }, [request.id, request.draftMessage, request.hostReviewDraft, request.privateFeedback]);

  // ── Save drafts action ───────────────────────────────────────────────────
  const [saveDraftsState, saveDraftsAction] = useActionState(
    saveDrafts,
    undefined as ReviewActionState,
  );
  useEffect(() => {
    if (saveDraftsState?.success) toast({ title: "Drafts saved" });
    if (saveDraftsState?.error && !saveDraftsState.error.startsWith("WARNING:")) {
      toast({ title: saveDraftsState.error, variant: "destructive" });
    }
  }, [saveDraftsState, toast]);

  // ── Save private feedback action ─────────────────────────────────────────
  const [feedbackState, feedbackAction] = useActionState(
    savePrivateFeedback,
    undefined as ReviewActionState,
  );
  useEffect(() => {
    if (feedbackState?.success) toast({ title: "Private feedback saved" });
    if (feedbackState?.error) toast({ title: feedbackState.error, variant: "destructive" });
  }, [feedbackState, toast]);

  // ── Mark sent action ─────────────────────────────────────────────────────
  const [sentState, sentAction] = useActionState(markSent, undefined as ReviewActionState);
  const isIssueWarning = sentState?.error?.startsWith("WARNING:");

  useEffect(() => {
    if (sentState?.success) {
      toast({ title: "Marked as sent" });
      onOpenChange(false);
    }
    if (sentState?.error && !isIssueWarning) {
      toast({ title: sentState.error, variant: "destructive" });
    }
  }, [sentState, isIssueWarning, toast, onOpenChange]);

  // ── Mark completed action ────────────────────────────────────────────────
  const [completedState, completedAction] = useActionState(
    markCompleted,
    undefined as ReviewActionState,
  );
  useEffect(() => {
    if (completedState?.success) {
      toast({ title: "Review request marked completed" });
      onOpenChange(false);
    }
    if (completedState?.error) toast({ title: completedState.error, variant: "destructive" });
  }, [completedState, toast, onOpenChange]);

  // ── AI generate ──────────────────────────────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const result = await generateDrafts(request.id);
      if ("error" in result) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        setDraftMessage(result.requestMessage);
        setHostReview(result.hostReview);
        toast({ title: "AI drafts generated — review and edit before saving" });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const guestName = request.guestStay?.guestName ?? "Guest";
  const propertyName = request.property.publicName;
  const checkIn = formatDate(request.guestStay?.checkIn);
  const checkOut = formatDate(request.guestStay?.checkOut);
  const status = request.status as string;
  const isSent = status === "SENT" || status === "COMPLETED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="flex-1">
              Review request — {guestName}
            </DialogTitle>
            <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
          <DialogDescription>
            {propertyName} · {checkIn} – {checkOut}
          </DialogDescription>
        </DialogHeader>

        {/* Unresolved issues warning */}
        {request.hasUnresolvedIssues && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              This property has unresolved issues. Consider resolving them before sending a review
              request to avoid a negative guest review.
            </span>
          </div>
        )}

        <div className="space-y-5">
          {/* AI generate button */}
          {!isSent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Bot />
              )}
              {isGenerating ? "Generating…" : "AI-draft both messages"}
            </Button>
          )}

          {/* Review-request message to guest */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Message to guest{" "}
              <span className="font-normal text-muted-foreground">(review request)</span>
            </label>
            <Textarea
              rows={5}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Draft a polite review request message for the guest…"
              disabled={isSent}
            />
          </div>

          {/* Host's review of the guest */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your review of the guest{" "}
              <span className="font-normal text-muted-foreground">(host-side)</span>
            </label>
            <Textarea
              rows={4}
              value={hostReview}
              onChange={(e) => setHostReview(e.target.value)}
              placeholder="Write a brief, honest review of the guest to post on your platform…"
              disabled={isSent}
            />
          </div>

          {/* Save drafts form */}
          {!isSent && (
            <form action={saveDraftsAction}>
              <input type="hidden" name="reviewRequestId" value={request.id} />
              <input type="hidden" name="draftMessage" value={draftMessage} />
              <input type="hidden" name="hostReviewDraft" value={hostReview} />
              <SubmitButton variant="outline" size="sm" pendingText="Saving…">
                <CheckCircle />
                Save drafts
              </SubmitButton>
            </form>
          )}

          {/* Private feedback (always editable) */}
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <Lock className="h-3.5 w-3.5" />
              Private feedback{" "}
              <span className="font-normal text-muted-foreground">(never shown to guest)</span>
            </label>
            <Textarea
              rows={3}
              value={privateFeedback}
              onChange={(e) => setPrivateFeedback(e.target.value)}
              placeholder="Internal notes about this guest or stay…"
            />
            <form action={feedbackAction}>
              <input type="hidden" name="reviewRequestId" value={request.id} />
              <input type="hidden" name="privateFeedback" value={privateFeedback} />
              <SubmitButton variant="ghost" size="sm" pendingText="Saving…">
                Save private feedback
              </SubmitButton>
            </form>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Issue-warning confirmation */}
          {isIssueWarning && (
            <p className="flex items-center gap-1.5 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              {sentState?.error?.replace("WARNING:", "").trim()}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            {status === "SENT" && (
              <form action={completedAction}>
                <input type="hidden" name="reviewRequestId" value={request.id} />
                <SubmitButton variant="success" pendingText="Saving…">
                  <CheckCircle />
                  Mark completed
                </SubmitButton>
              </form>
            )}

            {(status === "DRAFT" || status === "READY") && (
              <form action={sentAction}>
                <input type="hidden" name="reviewRequestId" value={request.id} />
                {isIssueWarning && (
                  <input type="hidden" name="forceWithIssues" value="true" />
                )}
                <SubmitButton
                  pendingText="Saving…"
                  disabled={!draftMessage.trim()}
                >
                  <Send />
                  {isIssueWarning ? "Send anyway" : "Mark as sent"}
                </SubmitButton>
              </form>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
