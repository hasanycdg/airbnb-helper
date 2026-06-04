"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeMember } from "@/server/members";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  memberId: string;
  memberName: string;
  /** Disable when this is the last owner. */
  disabled?: boolean;
}

export function RemoveMemberButton({ memberId, memberName, disabled }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (
      !confirm(
        `Remove ${memberName} from this organisation? They will lose all access immediately.`,
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set("memberId", memberId);
    startTransition(async () => {
      await removeMember(fd);
      toast({ title: `${memberName} removed from the team.` });
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={disabled || isPending}
      title={disabled ? "Cannot remove the last owner" : `Remove ${memberName}`}
      aria-label={`Remove ${memberName}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
