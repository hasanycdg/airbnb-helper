"use client";

import { useActionState, useEffect, useState } from "react";
import { LogIn } from "lucide-react";
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
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { impersonateOrganization, type AdminActionState } from "@/server/admin";

interface ImpersonateButtonProps {
  organizationId: string;
  orgName: string;
}

export function ImpersonateButton({ organizationId, orgName }: ImpersonateButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    impersonateOrganization,
    undefined,
  );

  useEffect(() => {
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
      setOpen(false);
    }
    // On success the server redirects, so no need to close manually
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="h-3 w-3" />
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Impersonate organization</DialogTitle>
          <DialogDescription>
            You are about to enter <strong>{orgName}</strong> as an OWNER. This action is{" "}
            <strong>audited</strong>. A membership record will be created if you are not already
            a member, documenting this support access. Only proceed for legitimate platform
            support.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton variant="destructive" pendingText="Entering org…">
              <LogIn className="h-4 w-4" />
              Enter as owner
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
