"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { requestCoverUploadAction, setCoverImageAction } from "@/server/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export function CoverImageUploader({
  propertyId,
  coverUrl,
}: {
  propertyId: string;
  coverUrl: string | null;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(coverUrl);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Nur Bilder", description: "Bitte ein Bild auswählen." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Bild zu groß", description: "Maximal 8 MB." });
      return;
    }
    setBusy(true);
    try {
      const target = await requestCoverUploadAction({
        propertyId,
        fileName: file.name,
        contentType: file.type,
      });
      if (!target) throw new Error("no target");
      const put = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload failed");
      await setCoverImageAction({ propertyId, url: target.publicUrl });
      setUrl(target.publicUrl);
      toast({ title: "Titelbild aktualisiert", description: "Erscheint jetzt im Gäste-Guide." });
    } catch {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: "Bitte erneut versuchen." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await setCoverImageAction({ propertyId, url: null });
      setUrl(null);
      toast({ title: "Titelbild entfernt" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Titelbild</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Titelbild" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
              Kein Bild — grüner Standard-Kopfbereich
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Bild hochladen
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={busy} onClick={remove}>
              <Trash2 />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Erscheint im Kopfbereich des Gäste-Guides.</p>
      </CardContent>
    </Card>
  );
}
