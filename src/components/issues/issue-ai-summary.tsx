"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { summarizeIssueAction } from "@/server/issues";
import { Button } from "@/components/ui/button";

/** On-demand AI summary — only calls the model when the host clicks. */
export function IssueAiSummary({ issueId }: { issueId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await summarizeIssueAction(issueId);
      setSummary(r || "Keine Zusammenfassung verfügbar.");
    } catch {
      setSummary("Zusammenfassung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
        <span className="mr-2 font-medium text-muted-foreground">KI-Zusammenfassung:</span>
        {summary}
      </div>
    );
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      KI-Zusammenfassung erstellen
    </Button>
  );
}
