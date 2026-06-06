"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTaskPhoto, requestCleaningUpload } from "@/server/cleaning";

interface TaskPhotoPanelProps {
  taskId: string;
  photos: string[];
  canComplete: boolean;
}

export function TaskPhotoPanel({ taskId, photos, canComplete }: TaskPhotoPanelProps) {
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Nur Bilder", description: "Bitte ein Bild auswählen." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Bild zu groß", description: "Maximal 8 MB." });
      return;
    }
    setUploading(true);
    try {
      const target = await requestCleaningUpload({ taskId, fileName: file.name, contentType: file.type });
      if (!target) throw new Error("no target");
      const put = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload failed");
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("photoUrl", target.publicUrl);
      const res = await addTaskPhoto(undefined, fd);
      if (res?.error) {
        toast({ variant: "destructive", title: "Fehler", description: res.error });
        return;
      }
      toast({ title: "Beweis-Foto hinzugefügt" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: "Bitte erneut versuchen." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm">Beweis-Fotos</CardTitle>
        {canComplete && photos.length < 20 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}{" "}
            Hochladen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {photos.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Noch keine Beweis-Fotos.{" "}
            {canComplete ? "Lade Fotos hoch, um die Reinigung zu dokumentieren." : ""}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {photos.length >= 20 && (
          <p className="text-xs text-muted-foreground">Maximal 20 Fotos erreicht.</p>
        )}
      </CardContent>
    </Card>
  );
}
