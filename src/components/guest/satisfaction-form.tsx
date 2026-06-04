"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ThumbsUp } from "lucide-react";
import { submitSatisfactionAction } from "@/server/guest";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PROBLEM_OPTIONS: { value: string; label: string }[] = [
  { value: "CHECK_IN", label: "Problem with check-in" },
  { value: "HEATING", label: "Problem with heating" },
  { value: "PARKING", label: "Problem with parking" },
  { value: "CLEANLINESS", label: "Problem with cleanliness" },
  { value: "WIFI", label: "Problem with WiFi" },
  { value: "NOISE", label: "Problem with noise" },
  { value: "OTHER", label: "Something else" },
];

export function SatisfactionForm({ token, question }: { token: string; question: string }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function submit(response: string, comment?: string) {
    setStatus("submitting");
    const fd = new FormData();
    fd.set("token", token);
    fd.set("response", response);
    if (comment) fd.set("comment", comment);
    await submitSatisfactionAction(undefined, fd);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {choice === "GOOD"
            ? "We're so glad you're enjoying your stay."
            : "Thanks for letting us know — the host has been notified and will help right away."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{question}</h1>

      <button
        onClick={() => {
          setChoice("GOOD");
          submit("GOOD");
        }}
        disabled={status === "submitting"}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-success/40 bg-success/5 p-4 text-left font-medium"
      >
        <ThumbsUp className="h-5 w-5 text-success" /> Everything is good
      </button>

      <p className="pt-2 text-sm text-muted-foreground">Or tell us what&apos;s wrong:</p>
      <div className="space-y-2">
        {PROBLEM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setChoice(opt.value)}
            className={cn(
              "block w-full rounded-lg border p-3 text-left text-sm",
              choice === opt.value ? "border-primary bg-primary/5" : "",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {choice && choice !== "GOOD" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const comment = (e.currentTarget.elements.namedItem("comment") as HTMLTextAreaElement)?.value;
            submit(choice, comment);
          }}
          className="space-y-3"
        >
          <Textarea name="comment" rows={3} placeholder="Add any details (optional)" />
          <Button type="submit" className="w-full" disabled={status === "submitting"}>
            {status === "submitting" && <Loader2 className="animate-spin" />}
            Send to host
          </Button>
        </form>
      )}
    </div>
  );
}
