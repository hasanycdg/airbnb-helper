"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember, type State } from "@/server/members";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/rbac";
import type { Role } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";

const ROLES: Role[] = ["OWNER", "MANAGER", "CLEANER"];

interface Props {
  planLimitReached: boolean;
  planLimitReason?: string;
}

export function InviteMemberDialog({ planLimitReached, planLimitReason }: Props) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("MANAGER");
  const { toast } = useToast();

  const [state, action] = useActionState<State, FormData>(inviteMember, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Invitation sent", description: "The invite email has been dispatched." });
      setOpen(false);
    }
  }, [state, toast]);

  if (planLimitReached) {
    return (
      <Button disabled title={planLimitReason}>
        <UserPlus /> Invite member
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Invite member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They will receive an email with a link to accept the invitation.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {/* Hidden role field so FormData carries it */}
          <input type="hidden" name="role" value={role} />

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="team@example.com"
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="font-medium">{ROLE_LABELS[r]}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[r]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton pendingText="Sending…">Send invitation</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
