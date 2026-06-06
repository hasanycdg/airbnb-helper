"use client";

import { useActionState, useEffect, useState } from "react";
import { Lightbulb, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { createFaqFromQuestionAction, generateFaqSuggestions, type State } from "@/server/questions";
import { truncate } from "@/lib/utils";

interface OrgProperty {
  id: string;
  publicName: string;
}

interface FaqSuggestionsPanelProps {
  initialSuggestions: string[];
  orgProperties: OrgProperty[];
  defaultPropertyId: string;
}

export function FaqSuggestionsPanel({
  initialSuggestions,
  orgProperties,
  defaultPropertyId,
}: FaqSuggestionsPanelProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // We reuse createFaqFromQuestionAction with a synthetic questionId="suggestion"
  // Simpler: use a dedicated action-state for the "create from suggestion" path.
  const [faqState, faqAction] = useActionState<State, FormData>(
    createFaqFromQuestionAction,
    undefined,
  );

  useEffect(() => {
    if (faqState?.success) {
      toast({ title: "FAQ section created from suggestion." });
      // Remove the suggestion from the list
      setSuggestions((prev) => prev.filter((s) => s !== selectedTopic));
      setDialogOpen(false);
    }
    if (faqState?.error) {
      toast({ title: faqState.error, variant: "destructive" });
    }
  }, [faqState, selectedTopic, toast]);

  async function generate() {
    setLoading(true);
    try {
      const next = await generateFaqSuggestions();
      setSuggestions(next);
      if (next.length === 0) {
        toast({ title: "Keine offenen Fragen", description: "Es gibt aktuell nichts vorzuschlagen." });
      }
    } catch {
      toast({ variant: "destructive", title: "Fehler", description: "Vorschläge konnten nicht erstellt werden." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-warning" />
              Suggested FAQ topics
            </CardTitle>
            <CardDescription>
              AI-suggested topics based on recent unanswered questions.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generate}
            disabled={loading}
            title="Vorschläge neu generieren"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestions.length === 0 && (
            <div className="space-y-3 py-2 text-center">
              <p className="text-sm text-muted-foreground">
                Lass die KI aus euren offenen Gästefragen FAQ-Themen vorschlagen.
              </p>
              <Button variant="secondary" size="sm" onClick={generate} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                Vorschläge generieren
              </Button>
            </div>
          )}
          {suggestions.map((topic) => (
            <div
              key={topic}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
            >
              <p className="text-sm">{truncate(topic, 100)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTopic(topic);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create FAQ from suggestion dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create FAQ guide section</DialogTitle>
            <DialogDescription>
              A new FAQ section will be added to the selected property guide.
            </DialogDescription>
          </DialogHeader>

          <form action={faqAction} className="space-y-4">
            {/* Pass a dummy questionId so the action can run without a real question */}
            <input type="hidden" name="questionId" value="_suggestion_" />

            {/* Property picker */}
            <div className="space-y-1.5">
              <label htmlFor="sugg-property" className="text-sm font-medium">
                Property
              </label>
              <select
                id="sugg-property"
                name="propertyId"
                defaultValue={defaultPropertyId}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {orgProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.publicName}
                  </option>
                ))}
              </select>
            </div>

            {/* Title — prefilled from suggestion topic */}
            <div className="space-y-1.5">
              <label htmlFor="sugg-title" className="text-sm font-medium">
                FAQ title
              </label>
              <input
                id="sugg-title"
                name="title"
                type="text"
                defaultValue={selectedTopic ?? ""}
                key={selectedTopic ?? ""}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. How does the keybox work?"
              />
            </div>

            {/* Optional answer */}
            <div className="space-y-1.5">
              <label htmlFor="sugg-content" className="text-sm font-medium">
                Answer{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="sugg-content"
                name="content"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Fill in the answer here, or leave blank and edit it later."
              />
            </div>

            {faqState?.error && (
              <p className="text-sm text-destructive">{faqState.error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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
