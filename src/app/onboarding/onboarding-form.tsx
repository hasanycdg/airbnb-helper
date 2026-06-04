"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/server/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

export function OnboardingForm() {
  const [state, formAction] = useActionState(createOrganizationAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" name="name" placeholder="e.g. Alpine Stays Tirol" required autoFocus />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton className="w-full" pendingText="Setting up…">
        Continue
      </SubmitButton>
      <p className="text-xs text-muted-foreground">
        Your free trial includes full Pro features for 14 days.
      </p>
    </form>
  );
}
