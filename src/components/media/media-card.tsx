"use client";

import React, { useState, useActionState } from "react";
import {
  Film,
  Image as ImageIcon,
  FileText,
  File,
  Pencil,
  Trash2,
  Link2,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import type { GuideMedia, GuideSection } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  updateMedia,
  deleteMedia,
  attachToSections,
  generateInstructionsFromTranscript,
} from "@/server/media";

type MediaTypeEnum = "IMAGE" | "VIDEO" | "PDF" | "FILE";

interface MediaCardProps {
  media: GuideMedia & { sections: Pick<GuideSection, "id" | "title">[] };
  allSections: Pick<GuideSection, "id" | "title">[];
}

const TYPE_ICON: Record<MediaTypeEnum, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: Film,
  PDF: FileText,
  FILE: File,
};

const TYPE_BADGE: Record<MediaTypeEnum, "default" | "secondary" | "warning" | "outline"> = {
  IMAGE: "outline",
  VIDEO: "default",
  PDF: "warning",
  FILE: "secondary",
};

export function MediaCard({ media, allSections }: MediaCardProps) {
  const { toast } = useToast();
  const TypeIcon = TYPE_ICON[media.type as MediaTypeEnum] ?? File;

  const [editOpen, setEditOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [editState, editAction] = useActionState(updateMedia, undefined);
  const [attachState, attachAction] = useActionState(attachToSections, undefined);
  const [aiState, aiAction] = useActionState(generateInstructionsFromTranscript, undefined);

  // Checkboxes for section attachment
  const [selectedSections, setSelectedSections] = useState<string[]>(
    media.sections.map((s) => s.id),
  );

  const [copiedAi, setCopiedAi] = useState(false);

  React.useEffect(() => {
    if (editState?.success) {
      toast({ title: "Media updated." });
      setEditOpen(false);
    } else if (editState?.error) {
      toast({ title: "Error", description: editState.error, variant: "destructive" });
    }
  }, [editState, toast]);

  React.useEffect(() => {
    if (attachState?.success) {
      toast({ title: "Sections updated." });
      setAttachOpen(false);
    } else if (attachState?.error) {
      toast({ title: "Error", description: attachState.error, variant: "destructive" });
    }
  }, [attachState, toast]);

  React.useEffect(() => {
    if (aiState?.error) {
      toast({ title: "AI error", description: aiState.error, variant: "destructive" });
    }
  }, [aiState, toast]);

  const handleCopyAi = () => {
    if (!aiState?.content) return;
    navigator.clipboard.writeText(aiState.content).then(() => {
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
    });
  };

  const fileExt = media.fileName?.split(".").pop()?.toUpperCase() ?? media.type;

  return (
    <>
      <Card className="group overflow-hidden">
        {/* Thumbnail / preview */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {media.type === "IMAGE" && media.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.title ?? media.fileName ?? "Image"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : media.type === "VIDEO" && media.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.thumbnailUrl}
              alt={media.title ?? media.fileName ?? "Video thumbnail"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <TypeIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute left-2 top-2 flex gap-1">
            <Badge variant={TYPE_BADGE[media.type as MediaTypeEnum]}>{fileExt}</Badge>
          </div>
          {media.sections.length > 0 && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary">{media.sections.length} section{media.sections.length !== 1 ? "s" : ""}</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <p className="truncate text-sm font-medium">{media.title ?? media.fileName ?? "Untitled"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {media.topic ? `#${media.topic}` : "No topic"}
            {media.fileSize
              ? ` · ${(media.fileSize / 1024 / 1024).toFixed(1)} MB`
              : ""}
          </p>
        </CardContent>

        <CardFooter className="gap-1 p-2 pt-0">
          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {/* Attach to sections */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Attach to sections"
            onClick={() => setAttachOpen(true)}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>

          {/* AI transcript tool — video only */}
          {media.type === "VIDEO" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Generate instructions from transcript"
              onClick={() => setAiOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}

          <div className="flex-1" />

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            title="Delete"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>

      {/* ── Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit media</DialogTitle>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="mediaId" value={media.id} />
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" defaultValue={media.title ?? ""} maxLength={120} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Topic</label>
              <Input name="topic" defaultValue={media.topic ?? ""} maxLength={80} placeholder="e.g. check-in, heating" />
            </div>
            {media.type === "VIDEO" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Transcript</label>
                <textarea
                  name="transcript"
                  defaultValue={media.transcript ?? ""}
                  rows={6}
                  className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
                    "text-sm ring-offset-background placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
                  )}
                  placeholder="Paste video transcript here…"
                />
              </div>
            )}
            {editState?.error && <p className="text-sm text-destructive">{editState.error}</p>}
            <DFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
            </DFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Attach to sections dialog ───────────────────────────── */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach to sections</DialogTitle>
          </DialogHeader>
          <form
            action={(fd) => {
              fd.set("sectionIds", JSON.stringify(selectedSections));
              attachAction(fd);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="mediaId" value={media.id} />

            {allSections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections found for this property.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {allSections.map((section) => (
                  <label
                    key={section.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedSections.includes(section.id)}
                      onChange={(e) => {
                        setSelectedSections((prev) =>
                          e.target.checked
                            ? [...prev, section.id]
                            : prev.filter((id) => id !== section.id),
                        );
                      }}
                    />
                    <span className="text-sm">{section.title}</span>
                  </label>
                ))}
              </div>
            )}

            {attachState?.error && <p className="text-sm text-destructive">{attachState.error}</p>}
            <DFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton pendingText="Saving…">Save sections</SubmitButton>
            </DFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AI instructions dialog ──────────────────────────────── */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate instructions from transcript</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI will rewrite the video transcript as clear guest instructions you can copy into a
              guide section.
            </p>

            {!media.transcript && (
              <p className="rounded-lg border border-warning bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
                No transcript saved yet. Go to Edit to paste the transcript first.
              </p>
            )}

            {aiState?.content && (
              <div className="relative rounded-xl border bg-muted/40 p-4">
                <p className="whitespace-pre-wrap text-sm">{aiState.content}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 gap-1"
                  onClick={handleCopyAi}
                >
                  {copiedAi ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}

            {aiState?.error && <p className="text-sm text-destructive">{aiState.error}</p>}
          </div>

          <DFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <form action={aiAction}>
              <input type="hidden" name="mediaId" value={media.id} />
              <SubmitButton
                disabled={!media.transcript}
                pendingText="Generating…"
              >
                <Sparkles className="h-4 w-4" />
                Generate
              </SubmitButton>
            </form>
          </DFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ──────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium">{media.title ?? media.fileName ?? "this file"}</span>? It
            will be removed from all sections. This cannot be undone.
          </p>
          <DFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <form action={deleteMedia}>
              <input type="hidden" name="mediaId" value={media.id} />
              <SubmitButton variant="destructive" pendingText="Deleting…">
                <Trash2 className="h-4 w-4" />
                Delete
              </SubmitButton>
            </form>
          </DFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
