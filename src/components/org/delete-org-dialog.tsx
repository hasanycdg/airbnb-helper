"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { deleteOrganizationAction, type OrgActionState } from "@/server/organization";

interface DeleteOrgDialogProps {
  orgName: string;
}

export function DeleteOrgDialog({ orgName }: DeleteOrgDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");

  const [state, formAction] = useActionState<OrgActionState, FormData>(
    deleteOrganizationAction,
    undefined,
  );

  // Reset typed value when dialog closes
  useEffect(() => {
    if (!open) setConfirmValue("");
  }, [open]);

  const isMatch = confirmValue.trim() === orgName.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 />
          Delete organization
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Delete organization</DialogTitle>
          <DialogDescription className="text-center">
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{orgName}</span> and{" "}
            <span className="font-semibold text-destructive">all of its data</span> — properties,
            guides, issues, cleaning tasks, members and everything else. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="confirm" value={confirmValue} />

          <div className="space-y-1.5">
            <Label htmlFor="confirmInput">
              Type{" "}
              <span className="select-all font-mono font-semibold text-foreground">{orgName}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirmInput"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={orgName}
              autoComplete="off"
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <SubmitButton
              variant="destructive"
              disabled={!isMatch}
              pendingText="Deleting…"
              className="w-full sm:w-auto"
            >
              <Trash2 />
              Delete permanently
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
