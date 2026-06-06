"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { IssueComment, User } from "@prisma/client";
import { addComment, draftGuestReplyAction, type IssueActionState } from "@/server/issues";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { initials, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Sparkles, Lock, MessageCircle } from "lucide-react";

export type CommentWithAuthor = IssueComment & {
  author: Pick<User, "id" | "name"> | null;
};

interface CommentThreadProps {
  issueId: string;
  comments: CommentWithAuthor[];
  canManage: boolean;
  canView: boolean;
}

export function CommentThread({ issueId, comments, canManage, canView }: CommentThreadProps) {
  const [isGuest, setIsGuest] = useState(false);
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [addState, addAction] = useActionState<IssueActionState, FormData>(
    addComment,
    undefined,
  );

  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    if (addState?.success) {
      setBody("");
      formRef.current?.reset();
      toast({ title: "Comment added" });
    } else if (addState?.error) {
      toast({ title: "Error", description: addState.error, variant: "destructive" });
    }
  }, [addState, toast]);

  if (!canView) return null;

  const internalComments = comments.filter((c) => c.isInternal);
  const guestComments = comments.filter((c) => !c.isInternal);

  return (
    <div className="space-y-6">
      {/* Internal notes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span>Internal notes</span>
          {internalComments.length > 0 && (
            <Badge variant="secondary" className="ml-1">{internalComments.length}</Badge>
          )}
        </div>

        {internalComments.length === 0 && (
          <p className="text-xs text-muted-foreground">No internal notes yet.</p>
        )}

        {internalComments.map((c) => (
          <CommentBubble key={c.id} comment={c} isInternal />
        ))}
      </div>

      <Separator />

      {/* Guest-facing thread */}
      {canManage && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span>Guest-facing replies</span>
            {guestComments.length > 0 && (
              <Badge variant="secondary" className="ml-1">{guestComments.length}</Badge>
            )}
          </div>

          {guestComments.length === 0 && (
            <p className="text-xs text-muted-foreground">No guest-facing responses yet.</p>
          )}

          {guestComments.map((c) => (
            <CommentBubble key={c.id} comment={c} isInternal={false} />
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Add comment</span>
          {canManage && (
            <div className="ml-auto flex items-center gap-1 rounded-full border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIsGuest(false)}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  !isGuest ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Internal
              </button>
              <button
                type="button"
                onClick={() => setIsGuest(true)}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  isGuest ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Guest reply
              </button>
            </div>
          )}
        </div>

        <form ref={formRef} action={addAction} className="space-y-3">
          <input type="hidden" name="issueId" value={issueId} />
          <input type="hidden" name="isInternal" value={String(!isGuest)} />
          <Textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isGuest ? "Write a reply to the guest…" : "Write an internal note…"}
            rows={3}
            required
          />
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton size="sm" pendingText="Posting…">
              {isGuest ? "Send guest reply" : "Add internal note"}
            </SubmitButton>

            {isGuest && canManage && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={drafting}
                onClick={async () => {
                  setDrafting(true);
                  try {
                    const fd = new FormData();
                    fd.set("issueId", issueId);
                    const r = await draftGuestReplyAction(undefined, fd);
                    if (r?.draft) setBody(r.draft);
                    else if (r?.error)
                      toast({ variant: "destructive", title: "AI draft failed", description: r.error });
                  } finally {
                    setDrafting(false);
                  }
                }}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {drafting ? "Drafting…" : "AI draft"}
              </Button>
            )}
          </div>
        </form>
        {addState?.error && (
          <p className="text-sm text-destructive">{addState.error}</p>
        )}
      </div>
    </div>
  );
}

function CommentBubble({
  comment,
  isInternal,
}: {
  comment: CommentWithAuthor;
  isInternal: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg p-3 text-sm",
        isInternal ? "bg-muted/40" : "bg-primary/5 border border-primary/10",
      )}
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[10px]">
          {initials(comment.author?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{comment.author?.name ?? "Unknown"}</span>
          {!isInternal && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Guest reply
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
      </div>
    </div>
  );
}
