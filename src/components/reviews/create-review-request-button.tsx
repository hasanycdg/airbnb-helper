"use client";

import { useActionState, useEffect } from "react";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { createReviewRequest, type ReviewActionState } from "@/server/reviews";

interface Props {
  guestStayId: string;
}

export function CreateReviewRequestButton({ guestStayId }: Props) {
  const { toast } = useToast();
  const [state, action] = useActionState(createReviewRequest, undefined as ReviewActionState);

  useEffect(() => {
    if (state?.success) toast({ title: "Review request created" });
    if (state?.error) toast({ title: state.error, variant: "destructive" });
  }, [state, toast]);

  return (
    <form action={action}>
      <input type="hidden" name="guestStayId" value={guestStayId} />
      <SubmitButton size="sm" variant="outline" pendingText="Creating…">
        <Plus />
        Prepare request
      </SubmitButton>
    </form>
  );
}
