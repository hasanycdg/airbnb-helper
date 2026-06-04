"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createPropertyAction } from "@/server/properties";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

export function NewPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createPropertyAction, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New property
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a property</DialogTitle>
          <DialogDescription>
            We&apos;ll create a starter guide with the common sections so you can publish quickly.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publicName">Public name (shown to guests)</Label>
            <Input id="publicName" name="publicName" placeholder="City Apartment Innsbruck" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalName">Internal name (optional)</Label>
            <Input id="internalName" name="internalName" placeholder="Innsbruck #1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City (optional)</Label>
            <Input id="city" name="city" placeholder="Innsbruck" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end">
            <SubmitButton pendingText="Creating…">Create property</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
