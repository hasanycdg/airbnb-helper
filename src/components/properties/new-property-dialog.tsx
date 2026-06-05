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
import { useT } from "@/components/app/app-i18n-provider";

export function NewPropertyDialog() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createPropertyAction, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t("props.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newprop.title")}</DialogTitle>
          <DialogDescription>{t("newprop.desc")}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publicName">{t("newprop.publicName")}</Label>
            <Input id="publicName" name="publicName" placeholder="City Apartment Innsbruck" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalName">{t("newprop.internalName")}</Label>
            <Input id="internalName" name="internalName" placeholder="Innsbruck #1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">{t("newprop.city")}</Label>
            <Input id="city" name="city" placeholder="Innsbruck" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end">
            <SubmitButton pendingText={t("newprop.creating")}>{t("newprop.create")}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
