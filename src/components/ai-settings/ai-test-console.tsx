"use client";

import { useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Terminal,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TestResult {
  question: string;
  answer: string;
  canAnswer: boolean;
  confidence: number;
  section: { slug: string; title: string } | null;
  fallback: boolean;
  error?: string;
}

export function AiTestConsole({
  slug,
  aiEnabled,
}: {
  slug: string;
  aiEnabled: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const sessionId = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `test-${Date.now()}`,
  );

  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`/api/g/${slug}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, locale: "EN", sessionId: sessionId.current }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setResults((prev) => [
          { question: q, answer: "", canAnswer: false, confidence: 0, section: null, fallback: false, error: err.error ?? "Request failed" },
          ...prev,
        ]);
        return;
      }

      const data = (await res.json()) as {
        answer: string;
        canAnswer: boolean;
        confidence: number;
        section: { slug: string; title: string } | null;
      };

      setResults((prev) => [
        {
          question: q,
          answer: data.answer,
          canAnswer: data.canAnswer,
          confidence: data.confidence,
          section: data.section,
          fallback: false,
        },
        ...prev,
      ]);
    } catch (err) {
      setResults((prev) => [
        {
          question: q,
          answer: "",
          canAnswer: false,
          confidence: 0,
          section: null,
          fallback: false,
          error: err instanceof Error ? err.message : "Network error",
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Test the assistant</CardTitle>
        </div>
        <CardDescription>
          Ask a question exactly as a guest would. The assistant uses the live guide content for
          this property and the confidence threshold you configured above.
          {!aiEnabled && (
            <span className="ml-1 text-warning">The assistant is currently disabled — responses here use the API directly regardless.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is the WiFi password?"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {results.length > 0 && (
          <div className="space-y-3">
            <Separator />
            {results.map((r, i) => (
              <div key={i} className={cn("rounded-lg border", r.error ? "border-destructive/40 bg-destructive/5" : "bg-muted/40")}>
                {/* Header row */}
                <button
                  type="button"
                  className="flex w-full items-start gap-3 p-3 text-left"
                  onClick={() => toggleExpand(i)}
                >
                  <div className="mt-0.5 shrink-0">
                    {r.error ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : r.canAnswer ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Bot className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium">{r.question}</p>
                    {r.error ? (
                      <p className="text-xs text-destructive">{r.error}</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={r.canAnswer ? "success" : "warning"} className="text-xs">
                          {r.canAnswer ? "Answered" : "Escalated to host"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          confidence: {(r.confidence * 100).toFixed(0)}%
                        </span>
                        {r.fallback && (
                          <Badge variant="secondary" className="text-xs">
                            offline fallback
                          </Badge>
                        )}
                        {r.section && (
                          <span className="text-xs text-muted-foreground">
                            matched: <em>{r.section.title}</em>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!r.error && (
                    <div className="shrink-0 text-muted-foreground">
                      {expanded.has(i) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded answer */}
                {!r.error && expanded.has(i) && (
                  <div className="border-t px-3 pb-3 pt-2">
                    <p className="whitespace-pre-wrap text-sm">{r.answer}</p>
                    {r.section && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        From guide section:{" "}
                        <code className="rounded bg-muted px-1">{r.section.slug}</code>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tests yet. Ask a question above to see how the assistant responds.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
