"use client";

import { useActionState, useEffect, useTransition } from "react";
import type { Role } from "@prisma/client";
import { changeRole, type State } from "@/server/members";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const ROLES: Role[] = ["OWNER", "MANAGER", "CLEANER"];

interface Props {
  memberId: string;
  currentRole: Role;
  /** Disable changes (e.g. current user is the last owner). */
  disabled?: boolean;
}

export function MemberRoleSelect({ memberId, currentRole, disabled }: Props) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [state, action] = useActionState<State, FormData>(changeRole, undefined);

  useEffect(() => {
    if (state?.error) {
      toast({ title: "Could not change role", description: state.error, variant: "destructive" });
    }
    if (state?.success) {
      toast({ title: "Role updated" });
    }
  }, [state, toast]);

  function handleChange(newRole: string) {
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("role", newRole);
    startTransition(() => action(fd));
  }

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
