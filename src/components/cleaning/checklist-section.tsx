"use client";

import { useActionState, useEffect, useState } from "react";
import { Camera, Check, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleItem, setItemPhoto, setItemNote } from "@/server/cleaning";

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
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [photoValue, setPhotoValue] = useState(item.photoUrl ?? "");
  const [noteValue, setNoteValue] = useState(item.note ?? "");

  const [toggleState, toggleAction] = useActionState(toggleItem, undefined);
  const [photoState, photoAction] = useActionState(setItemPhoto, undefined);
  const [noteState, noteAction] = useActionState(setItemNote, undefined);

  useEffect(() => {
    if (toggleState?.error) toast({ title: "Error", description: toggleState.error, variant: "destructive" });
  }, [toggleState, toast]);

  useEffect(() => {
    if (photoState?.success) {
      toast({ title: "Photo saved." });
      setShowPhotoInput(false);
    }
    if (photoState?.error) toast({ title: "Error", description: photoState.error, variant: "destructive" });
  }, [photoState, toast]);

  useEffect(() => {
    if (noteState?.success) {
      toast({ title: "Note saved." });
      setShowNoteInput(false);
    }
    if (noteState?.error) toast({ title: "Error", description: noteState.error, variant: "destructive" });
  }, [noteState, toast]);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        item.isDone ? "bg-muted/40" : "bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        {canComplete ? (
          <form action={toggleAction} className="mt-0.5 shrink-0">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="taskId" value={taskId} />
            <button type="submit" aria-label={item.isDone ? "Mark undone" : "Mark done"}>
              <Checkbox
                checked={item.isDone}
                onCheckedChange={() => undefined}
                className="pointer-events-none"
              />
            </button>
          </form>
        ) : (
          <Checkbox
            checked={item.isDone}
            onCheckedChange={() => undefined}
            disabled
            className="mt-0.5 shrink-0"
          />
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

          {/* Existing note/photo pills */}
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
                  <Camera className="h-3 w-3" /> View photo
                </a>
              )}
            </div>
          )}

          {/* Photo input */}
          {showPhotoInput && canComplete && (
            <form action={photoAction} className="flex items-center gap-2">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="taskId" value={taskId} />
              <Input
                name="photoUrl"
                value={photoValue}
                onChange={(e) => setPhotoValue(e.target.value)}
                placeholder="https://… photo URL"
                className="h-8 text-xs"
                type="url"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-8 shrink-0">
                <Check className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 shrink-0"
                onClick={() => setShowPhotoInput(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </form>
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
                placeholder="Add a note…"
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

        {/* Action buttons */}
        {canComplete && !showPhotoInput && !showNoteInput && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Add photo URL"
              onClick={() => {
                setShowNoteInput(false);
                setShowPhotoInput(true);
              }}
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Add note"
              onClick={() => {
                setShowPhotoInput(false);
                setShowNoteInput(true);
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChecklistSection({
  room,
  items,
  taskId,
  canComplete,
}: ChecklistSectionProps) {
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
          <ChecklistItemRow
            key={item.id}
            item={item}
            taskId={taskId}
            canComplete={canComplete}
          />
        ))}
      </CardContent>
    </Card>
  );
}
