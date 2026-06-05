"use client";

import { useActionState, useEffect, useState } from "react";
import { Languages, Loader2, Sparkles } from "lucide-react";
import type { Locale } from "@prisma/client";
import {
  generateDraftAction,
  saveTranslationAction,
  translateSectionAction,
  updateSectionAction,
} from "@/server/guide";
import { LOCALE_LABELS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

type TranslationMap = Record<string, { title: string; content: string }>;

export function SectionEditor({
  section,
  otherLocales,
  initialTranslations,
}: {
  section: EditorSection;
  otherLocales: Locale[];
  initialTranslations: TranslationMap;
}) {
  const { toast } = useToast();
  const [saveState, saveAction] = useActionState(updateSectionAction, undefined);
  const [genState, genAction] = useActionState(generateDraftAction, undefined);

  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content ?? "");
  const [translations, setTranslations] = useState<TranslationMap>(initialTranslations);
  const [busy, setBusy] = useState<string | null>(null); // "<locale>:translate" | "<locale>:save"

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

  function setTr(locale: Locale, field: "title" | "content", value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        title: prev[locale]?.title ?? "",
        content: prev[locale]?.content ?? "",
        [field]: value,
      },
    }));
  }

  async function aiTranslate(locale: Locale) {
    if (!title.trim() && !content.trim()) {
      toast({ variant: "destructive", title: "Nothing to translate", description: "Add a title or content first." });
      return;
    }
    setBusy(`${locale}:translate`);
    try {
      const r = await translateSectionAction({ sectionId: section.id, locale, title, content });
      if (r.ok) {
        setTranslations((prev) => ({ ...prev, [locale]: { title: r.title, content: r.content } }));
        toast({ title: "Translated", description: `${LOCALE_LABELS[locale].native} updated.` });
      } else {
        toast({ variant: "destructive", title: "AI", description: r.error ?? "Translation failed." });
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveTranslation(locale: Locale) {
    setBusy(`${locale}:save`);
    try {
      const fd = new FormData();
      fd.set("sectionId", section.id);
      fd.set("locale", locale);
      fd.set("title", translations[locale]?.title ?? "");
      fd.set("content", translations[locale]?.content ?? "");
      await saveTranslationAction(fd);
      toast({ title: "Translation saved" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* AI draft */}
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

      {/* Main editable fields (controlled, so translations use live values) */}
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="sectionId" value={section.id} />
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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

      {/* Translations — operate on the LIVE title & content above */}
      {otherLocales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" /> Translations
            </CardTitle>
            <CardDescription>
              &ldquo;AI translate&rdquo; translates the title &amp; content above — including unsaved
              edits. Review, then save each language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {otherLocales.map((locale) => (
              <div key={locale} className="space-y-2 border-t pt-5 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {LOCALE_LABELS[locale].flag} {LOCALE_LABELS[locale].native}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    disabled={busy !== null}
                    onClick={() => aiTranslate(locale)}
                  >
                    {busy === `${locale}:translate` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    AI translate
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    className="h-8"
                    value={translations[locale]?.title ?? ""}
                    onChange={(e) => setTr(locale, "title", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Content</Label>
                  <Textarea
                    rows={4}
                    className="text-sm"
                    value={translations[locale]?.content ?? ""}
                    onChange={(e) => setTr(locale, "content", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => saveTranslation(locale)}
                >
                  {busy === `${locale}:save` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save translation
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
