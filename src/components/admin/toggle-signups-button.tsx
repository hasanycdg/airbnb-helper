"use client";

import { useActionState, useEffect } from "react";
import { UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { toggleSignups, type AdminActionState } from "@/server/admin";

export function ToggleSignupsButton({ initialEnabled }: { initialEnabled: boolean }) {
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    toggleSignups,
    undefined,
  );

  useEffect(() => {
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    } else if (state?.success) {
      toast({ title: "Signup access updated." });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="enabled" value={initialEnabled ? "false" : "true"} />
      <Button
        type="submit"
        variant={initialEnabled ? "destructive" : "outline"}
        size="sm"
        disabled={pending}
      >
        {initialEnabled ? (
          <>
            <UserX className="h-4 w-4" />
            Disable signups
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Enable signups
          </>
        )}
      </Button>
    </form>
  );
}
