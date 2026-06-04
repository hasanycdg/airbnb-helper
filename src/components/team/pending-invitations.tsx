"use client";

import { useActionState, useEffect, useTransition } from "react";
import { MailX, RefreshCw } from "lucide-react";
import type { InvitationStatus, Role } from "@prisma/client";
import { revokeInvitation, resendInvitation, type State } from "@/server/members";
import { ROLE_LABELS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export interface PendingInvitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

interface Props {
  invitations: PendingInvitation[];
  canManage: boolean;
}

function ResendButton({ invitationId }: { invitationId: string }) {
  const { toast } = useToast();
  const [state, action] = useActionState<State, FormData>(resendInvitation, undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) toast({ title: "Invitation resent." });
    if (state?.error) toast({ title: "Failed to resend", description: state.error, variant: "destructive" });
  }, [state, toast]);

  function handleResend() {
    const fd = new FormData();
    fd.set("invitationId", invitationId);
    startTransition(() => action(fd));
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={isPending}
      title="Resend invitation email"
    >
      <RefreshCw className={isPending ? "animate-spin" : ""} />
      <span className="sr-only sm:not-sr-only">Resend</span>
    </Button>
  );
}

function RevokeButton({ invitationId, email }: { invitationId: string; email: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm(`Revoke the invitation for ${email}?`)) return;
    const fd = new FormData();
    fd.set("invitationId", invitationId);
    startTransition(async () => {
      await revokeInvitation(fd);
      toast({ title: "Invitation revoked." });
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleRevoke}
      disabled={isPending}
      title={`Revoke invitation for ${email}`}
      aria-label="Revoke"
    >
      <MailX className="h-4 w-4" />
    </Button>
  );
}

export function PendingInvitations({ invitations, canManage }: Props) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-2">
      {invitations.map((inv) => {
        const isExpired = inv.expiresAt < new Date();
        return (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[inv.role]} &middot; Expires {formatDate(inv.expiresAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isExpired ? "destructive" : "warning"} className="shrink-0">
                {isExpired ? "Expired" : "Pending"}
              </Badge>

              {canManage && (
                <div className="flex items-center gap-1">
                  <ResendButton invitationId={inv.id} />
                  <RevokeButton invitationId={inv.id} email={inv.email} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
