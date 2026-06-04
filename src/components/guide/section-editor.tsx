"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { generateDraftAction, updateSectionAction } from "@/server/guide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";

interface EditorSection {
  id: string;
  title: string;
  shortDescription: string | null;
  content: string;
  mapEmbedUrl: string | null;
  internalNotes: string | null;
}

export function SectionEditor({ section }: { section: EditorSection }) {
  const { toast } = useToast();
  const [saveState, saveAction] = useActionState(updateSectionAction, undefined);
  const [genState, genAction] = useActionState(generateDraftAction, undefined);
  const [content, setContent] = useState(section.content ?? "");

  useEffect(() => {
    if (genState?.content) {
      setContent(genState.content);
      toast({ title: "Draft ready", description: "Review and edit, then save." });
    }
    if (genState?.error) toast({ variant: "destructive", title: "AI", description: genState.error });
  }, [genState, toast]);

  useEffect(() => {
    if (saveState?.success) toast({ title: "Saved", description: "Section updated." });
    if (saveState?.error) toast({ variant: "destructive", title: "Error", description: saveState.error });
  }, [saveState, toast]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Draft with AI
          </CardTitle>
          <CardDescription>
            Paste rough notes — we&apos;ll write a clean, friendly section. You always review before
            saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={genAction} className="space-y-3">
            <input type="hidden" name="sectionId" value={section.id} />
            <Textarea
              name="notes"
              rows={3}
              placeholder="e.g. keybox is right of the door, code 4729, slide cover down to release key"
            />
            <SubmitButton variant="secondary" pendingText="Writing…">
              <Sparkles /> Generate draft
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="sectionId" value={section.id} />
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={section.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short description</Label>
          <Input
            id="shortDescription"
            name="shortDescription"
            defaultValue={section.shortDescription ?? ""}
            placeholder="One line shown under the title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Markdown supported (**bold**, lists, links).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapEmbedUrl">Map embed URL</Label>
          <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={section.mapEmbedUrl ?? ""} placeholder="Google Maps share link" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalNotes">Internal notes (host only — never shown to guests)</Label>
          <Textarea id="internalNotes" name="internalNotes" defaultValue={section.internalNotes ?? ""} rows={2} />
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingText="Saving…">Save section</SubmitButton>
        </div>
      </form>
    </div>
  );
}
