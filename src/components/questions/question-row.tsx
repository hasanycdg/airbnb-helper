"use client";

import { useActionState, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import type { Locale } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import { LOCALE_LABELS } from "@/lib/constants";
import {
  markAnsweredAction,
  markEscalatedAction,
  createFaqFromQuestionAction,
  type State,
} from "@/server/questions";

// ── Types ──────────────────────────────────────────────────────────────────

export interface QuestionRowData {
  id: string;
  question: string;
  locale: Locale;
  answered: boolean;
  escalated: boolean;
  confidence: number | null;
  createdAt: Date;
  property: { id: string; publicName: string };
  matchedSection: { title: string } | null;
}

interface OrgProperty {
  id: string;
  publicName: string;
}

interface QuestionRowProps {
  question: QuestionRowData;
  orgProperties: OrgProperty[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function QuestionRow({ question, orgProperties }: QuestionRowProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const [markState, markAction] = useActionState<State, FormData>(markAnsweredAction, undefined);
  const [escalateState, escalateAction] = useActionState<State, FormData>(markEscalatedAction, undefined);
  const [faqState, faqAction] = useActionState<State, FormData>(createFaqFromQuestionAction, undefined);

  // Toast feedback for mark-answered
  useEffect(() => {
    if (markState?.success) toast({ title: "Question marked as answered." });
    if (markState?.error) toast({ title: markState.error, variant: "destructive" });
  }, [markState, toast]);

  // Toast feedback for escalate
  useEffect(() => {
    if (escalateState?.success) toast({ title: "Question escalated to host." });
    if (escalateState?.error) toast({ title: escalateState.error, variant: "destructive" });
  }, [escalateState, toast]);

  // Toast + close dialog on FAQ created
  useEffect(() => {
    if (faqState?.success) {
      toast({ title: "FAQ guide section created." });
      setFaqOpen(false);
    }
    if (faqState?.error) toast({ title: faqState.error, variant: "destructive" });
  }, [faqState, toast]);

  const localeInfo = LOCALE_LABELS[question.locale];
  const confidencePct = question.confidence != null ? Math.round(question.confidence * 100) : null;

  return (
    <>
      {/* Row */}
      <div
        className={cn(
          "rounded-lg border bg-card p-4 transition-colors",
          question.escalated && "border-destructive/40 bg-destructive/5",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Locale flag */}
          <span
            className="mt-0.5 shrink-0 text-lg leading-none"
            title={localeInfo.name}
            aria-label={localeInfo.name}
          >
            {localeInfo.flag}
          </span>

          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-snug">
              {truncate(question.question, 160)}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{question.property.publicName}</span>
              {question.matchedSection && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {question.matchedSection.title}
                  </span>
                </>
              )}
              {confidencePct != null && (
                <>
                  <span>·</span>
                  <span
                    className={cn(
                      confidencePct >= 70
                        ? "text-success"
                        : confidencePct >= 40
                          ? "text-warning"
                          : "text-destructive",
                    )}
                  >
                    {confidencePct}% confidence
                  </span>
                </>
              )}
              <span>·</span>
              <span>{formatDateTime(question.createdAt)}</span>
            </div>
          </div>

          {/* Badges + toggle */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-1.5">
              {question.answered ? (
                <Badge variant="success">Answered</Badge>
              ) : (
                <Badge variant="secondary">Unanswered</Badge>
              )}
              {question.escalated && <Badge variant="destructive">Escalated</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse actions" : "Expand actions"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded actions */}
        {expanded && (
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {!question.answered && (
              <form action={markAction}>
                <input type="hidden" name="questionId" value={question.id} />
                <SubmitButton
                  variant="outline"
                  size="sm"
                  pendingText="Marking…"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark answered
                </SubmitButton>
              </form>
            )}

            {!question.escalated && (
              <form action={escalateAction}>
                <input type="hidden" name="questionId" value={question.id} />
                <SubmitButton
                  variant="outline"
                  size="sm"
                  pendingText="Escalating…"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalate
                </SubmitButton>
              </form>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFaqOpen(true)}
            >
              <BookOpen className="h-4 w-4" />
              Create FAQ from this
            </Button>
          </div>
        )}
      </div>

      {/* Create FAQ dialog */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create FAQ guide section</DialogTitle>
            <DialogDescription>
              A new FAQ section will be added to the selected property guide using
              this question as the title.
            </DialogDescription>
          </DialogHeader>

          <form action={faqAction} className="space-y-4">
            <input type="hidden" name="questionId" value={question.id} />

            {/* Property picker */}
            <div className="space-y-1.5">
              <label htmlFor="faq-property" className="text-sm font-medium">
                Property
              </label>
              <select
                id="faq-property"
                name="propertyId"
                defaultValue={question.property.id}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {orgProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.publicName}
                  </option>
                ))}
              </select>
            </div>

            {/* Title — prefilled from question */}
            <div className="space-y-1.5">
              <label htmlFor="faq-title" className="text-sm font-medium">
                FAQ title
              </label>
              <input
                id="faq-title"
                name="title"
                type="text"
                defaultValue={truncate(question.question, 120)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. How does the keybox work?"
              />
            </div>

            {/* Optional answer content */}
            <div className="space-y-1.5">
              <label htmlFor="faq-content" className="text-sm font-medium">
                Answer / content{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                id="faq-content"
                name="content"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write the answer here, or leave blank and fill it in later in the guide editor."
              />
            </div>

            {faqState?.error && (
              <p className="text-sm text-destructive">{faqState.error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFaqOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton pendingText="Creating…">Create FAQ section</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
