"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import type { QRCodeType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { createQrCodeAction } from "@/server/qrcodes";
import { QR_CODE_LABELS } from "@/lib/constants";

interface CreateQrDialogProps {
  propertyId: string;
  sections: { id: string; title: string; slug: string }[];
}

const QR_TYPES: QRCodeType[] = [
  "FULL_GUIDE",
  "WIFI",
  "HEATING",
  "PARKING",
  "TRASH",
  "CHECKOUT",
  "ISSUE_REPORT",
  "RECOMMENDATIONS",
  "SECTION",
];

export function CreateQrDialog({ propertyId, sections }: CreateQrDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<QRCodeType>("FULL_GUIDE");

  const [state, dispatch] = useActionState(createQrCodeAction, undefined);

  React.useEffect(() => {
    if (state?.success) {
      toast({ title: "QR code created", description: "Your new QR code is ready to use." });
      setOpen(false);
      setSelectedType("FULL_GUIDE");
    }
    if (state?.error) {
      toast({ title: "Error", description: state.error, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        New QR code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create QR code</DialogTitle>
            <DialogDescription>
              Generate a QR code for your guests. Choose the type and optionally add a label.
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-4">
            <input type="hidden" name="propertyId" value={propertyId} />

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="qr-type">Type</Label>
              <Select
                name="type"
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as QRCodeType)}
              >
                <SelectTrigger id="qr-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {QR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {QR_CODE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section picker — only shown when type === SECTION */}
            {selectedType === "SECTION" && (
              <div className="space-y-1.5">
                <Label htmlFor="qr-section">Section</Label>
                {sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sections found. Add guide sections first.
                  </p>
                ) : (
                  <Select name="sectionId">
                    <SelectTrigger id="qr-section">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Custom label */}
            <div className="space-y-1.5">
              <Label htmlFor="qr-label">
                Label{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="qr-label"
                name="label"
                placeholder="e.g. Bedroom door, Living room frame…"
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                Helps you identify where this code is placed.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton pendingText="Creating…">Create QR code</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
