"use client";

import { useActionState, useEffect, useState } from "react";
import { Camera, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { addTaskPhoto } from "@/server/cleaning";

interface TaskPhotoPanelProps {
  taskId: string;
  photos: string[];
  canComplete: boolean;
}

export function TaskPhotoPanel({ taskId, photos, canComplete }: TaskPhotoPanelProps) {
  const { toast } = useToast();
  const [showInput, setShowInput] = useState(false);
  const [state, action] = useActionState(addTaskPhoto, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Proof photo added." });
      setShowInput(false);
    }
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm">Proof photos</CardTitle>
        {canComplete && photos.length < 20 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => setShowInput((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {photos.length === 0 && !showInput && (
          <p className="text-xs text-muted-foreground">
            No proof photos yet.{" "}
            {canComplete ? "Add photo URLs to document the clean." : ""}
          </p>
        )}

        {/* Photo list */}
        <div className="space-y-1.5">
          {photos.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs hover:bg-accent"
            >
              <Camera className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{url}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>

        {showInput && canComplete && (
          <form action={action} className="space-y-2">
            <input type="hidden" name="taskId" value={taskId} />
            <div className="space-y-1">
              <Label className="text-xs">Photo URL</Label>
              <Input
                name="photoUrl"
                type="url"
                placeholder="https://… photo URL"
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="flex gap-2">
              <SubmitButton size="sm" pendingText="Adding…" className="flex-1">
                Add photo
              </SubmitButton>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setShowInput(false)}
              >
                Cancel
              </Button>
            </div>
            {state?.error && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
          </form>
        )}

        {photos.length >= 20 && (
          <p className="text-xs text-muted-foreground">Maximum 20 photos reached.</p>
        )}
      </CardContent>
    </Card>
  );
}
