"use client";

import { useActionState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { openPortal, type BillingState } from "@/server/billing";

export function ManageBillingButton() {
  const [state, action, isPending] = useActionState<BillingState, FormData>(
    openPortal,
    undefined,
  );
  const { toast } = useToast();
  const toastFiredRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    if (toastFiredRef.current) return;
    if (state.error) {
      toastFiredRef.current = true;
      toast({
        title: "Billing portal unavailable",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  useEffect(() => {
    if (!state) toastFiredRef.current = false;
  }, [state]);

  return (
    <form action={action}>
      <SubmitButton
        variant="outline"
        pendingText="Opening portal…"
        disabled={isPending}
        size="sm"
      >
        <ExternalLink className="h-4 w-4" />
        Manage billing
      </SubmitButton>
    </form>
  );
}
