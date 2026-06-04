"use client";

import { useActionState, useEffect, useState } from "react";
import { Bot, Info, Shield } from "lucide-react";
import { updateAiSettings } from "@/server/ai-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";

interface AiSettingsFormProps {
  propertyId: string;
  slug: string;
  aiEnabled: boolean;
  aiConfidenceThreshold: number;
  aiSystemPromptExtra: string | null;
  hasAiCapability: boolean;
  planName: string;
}

export function AiSettingsForm({
  propertyId,
  slug,
  aiEnabled,
  aiConfidenceThreshold,
  aiSystemPromptExtra,
  hasAiCapability,
  planName,
}: AiSettingsFormProps) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateAiSettings, undefined);
  const [enabled, setEnabled] = useState(aiEnabled);
  const [threshold, setThreshold] = useState(String(aiConfidenceThreshold));

  useEffect(() => {
    if (state?.success) {
      toast({ title: "AI settings saved", description: "Changes are now live for guests." });
    }
    if (state?.error) {
      toast({ variant: "destructive", title: "Save failed", description: state.error });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      {!hasAiCapability && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="text-sm font-medium">AI assistant requires Premium or Manager plan</p>
              <p className="text-sm text-muted-foreground">
                Your current plan is <strong>{planName}</strong>. Upgrade to unlock the guest AI
                assistant, unlimited AI messages, and more.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Guest AI assistant</CardTitle>
          </div>
          <CardDescription>
            A conversational assistant embedded in your guest guide. It answers questions
            exclusively from your approved guide content and never invents details. When it
            can&apos;t help, it offers to contact you directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            <input type="hidden" name="propertyId" value={propertyId} />
            {/* Hidden field carries the switch state since unchecked checkboxes aren't submitted */}
            <input type="hidden" name="aiEnabled" value={String(enabled)} />
            <input type="hidden" name="aiConfidenceThreshold" value={threshold} />

            {/* Enable toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="aiEnabled" className="text-base">
                  Enable AI assistant
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, a chat button appears on the guest guide at{" "}
                  <code className="rounded bg-muted px-1 text-xs">/g/{slug}</code>.
                </p>
              </div>
              <Switch
                id="aiEnabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!hasAiCapability}
              />
            </div>

            {/* Confidence threshold */}
            <div className="space-y-2">
              <Label htmlFor="aiConfidenceThreshold">
                Minimum confidence threshold{" "}
                <span className="font-normal text-muted-foreground">(0 – 1)</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="aiConfidenceThreshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  className="w-28"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  disabled={!hasAiCapability}
                />
                <span className="text-sm text-muted-foreground">
                  {Number(threshold) < 0.5
                    ? "Permissive — may include uncertain answers"
                    : Number(threshold) >= 0.8
                      ? "Strict — fewer answers, higher accuracy"
                      : "Balanced (recommended: 0.6)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Answers with a confidence score below this threshold are treated as unanswered and
                escalated to you.
              </p>
            </div>

            {/* Extra system prompt */}
            <div className="space-y-2">
              <Label htmlFor="aiSystemPromptExtra">House-specific guidance (optional)</Label>
              <Textarea
                id="aiSystemPromptExtra"
                name="aiSystemPromptExtra"
                rows={4}
                maxLength={2000}
                defaultValue={aiSystemPromptExtra ?? ""}
                placeholder="e.g. Always remind guests to close the terrace door in rain. Pool hours are 8am–10pm."
                disabled={!hasAiCapability}
              />
              <p className="text-xs text-muted-foreground">
                These instructions are appended to the AI&apos;s system prompt. They can remind the
                assistant of property-specific priorities — but cannot override the core guardrails
                below.
              </p>
            </div>

            <div className="flex justify-end">
              <SubmitButton disabled={!hasAiCapability} pendingText="Saving…">
                Save AI settings
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Guardrails explanation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Built-in guardrails</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Separator />
          <ul className="space-y-2 pt-1 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                Grounded
              </Badge>
              The assistant answers <strong>only</strong> from your approved guide sections.
              It will not guess WiFi passwords, check-in codes, legal information, or anything
              not explicitly in your content.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                Escalation
              </Badge>
              When a question falls outside the guide content or below the confidence threshold,
              the assistant politely tells the guest it isn&apos;t sure and offers to pass the
              question to you.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                Verbatim
              </Badge>
              Exact codes, names, addresses, and URLs are never paraphrased — they are reproduced
              word-for-word from your guide.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                Offline fallback
              </Badge>
              If the AI service is unavailable, the assistant falls back to keyword-based retrieval
              so guests always get a best-effort answer.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
