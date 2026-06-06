"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestCleaningUpload, setItemNote, setItemPhoto, toggleItem } from "@/server/cleaning";

interface TaskItem {
  id: string;
  label: string;
  room: string | null;
  order: number;
  isDone: boolean;
  doneAt: Date | null;
  photoUrl: string | null;
  note: string | null;
}

interface ChecklistSectionProps {
  room: string;
  items: TaskItem[];
  taskId: string;
  canComplete: boolean;
}

function ChecklistItemRow({
  item,
  taskId,
  canComplete,
}: {
  item: TaskItem;
  taskId: string;
  canComplete: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState(item.note ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const toggleFormRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [toggleState, toggleAction] = useActionState(toggleItem, undefined);
  const [noteState, noteAction] = useActionState(setItemNote, undefined);

  useEffect(() => {
    if (toggleState?.error)
      toast({ title: "Error", description: toggleState.error, variant: "destructive" });
  }, [toggleState, toast]);

  useEffect(() => {
    if (noteState?.success) {
      toast({ title: "Note saved." });
      setShowNoteInput(false);
    }
    if (noteState?.error)
      toast({ title: "Error", description: noteState.error, variant: "destructive" });
  }, [noteState, toast]);

  async function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
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
    setUploadingPhoto(true);
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
      fd.set("itemId", item.id);
      fd.set("taskId", taskId);
      fd.set("photoUrl", target.publicUrl);
      const res = await setItemPhoto(undefined, fd);
      if (res?.error) {
        toast({ variant: "destructive", title: "Fehler", description: res.error });
        return;
      }
      toast({ title: "Foto gespeichert" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: "Bitte erneut versuchen." });
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        item.isDone ? "bg-muted/40" : "bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Toggle done — the Checkbox itself submits the form (no nested button) */}
        {canComplete ? (
          <form ref={toggleFormRef} action={toggleAction} className="mt-0.5 shrink-0">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="taskId" value={taskId} />
            <Checkbox
              checked={item.isDone}
              onCheckedChange={() => toggleFormRef.current?.requestSubmit()}
              aria-label={item.isDone ? "Mark undone" : "Mark done"}
            />
          </form>
        ) : (
          <Checkbox checked={item.isDone} disabled className="mt-0.5 shrink-0" />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <span
            className={cn(
              "text-sm font-medium",
              item.isDone ? "text-muted-foreground line-through" : "",
            )}
          >
            {item.label}
          </span>

          {/* Existing note / photo pills */}
          {(item.note || item.photoUrl) && (
            <div className="flex flex-wrap gap-2">
              {item.note && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" /> {item.note}
                </span>
              )}
              {item.photoUrl && (
                <a
                  href={item.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:underline"
                >
                  <Camera className="h-3 w-3" /> Foto ansehen
                </a>
              )}
            </div>
          )}

          {/* Note input */}
          {showNoteInput && canComplete && (
            <form action={noteAction} className="flex items-center gap-2">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="taskId" value={taskId} />
              <Input
                name="note"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Notiz hinzufügen…"
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-8 shrink-0">
                <Check className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 shrink-0"
                onClick={() => setShowNoteInput(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </form>
          )}
        </div>

        {/* Hidden file input for photo upload */}
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoFile} />

        {/* Action buttons */}
        {canComplete && !showNoteInput && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Foto hochladen"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Notiz"
              onClick={() => setShowNoteInput(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChecklistSection({ room, items, taskId, canComplete }: ChecklistSectionProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-muted-foreground">
          {room}
          <span className="ml-2 text-xs">
            ({items.filter((i) => i.isDone).length}/{items.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.map((item) => (
          <ChecklistItemRow key={item.id} item={item} taskId={taskId} canComplete={canComplete} />
        ))}
      </CardContent>
    </Card>
  );
}
