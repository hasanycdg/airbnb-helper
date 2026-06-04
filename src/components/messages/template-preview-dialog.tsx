"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { renderTemplate } from "@/lib/messages";
import { MESSAGE_TYPE_LABELS } from "@/lib/constants";
import type { MessageType } from "@prisma/client";

/** Demo variables used in the preview so every placeholder renders visibly. */
const DEMO_VARS: Record<string, string> = {
  guest_name: "Sarah",
  property_name: "Alpine Chalet Tirol",
  check_in_time: "15:00",
  check_out_time: "10:00",
  guide_link: "https://stayguide.pro/g/alpine-chalet",
  wifi_name: "AlpineChalet_5G",
  wifi_password: "Tirol2024!",
  parking_info: "Use the gravel area in front of the garage.",
  host_name: "Hannes",
  host_phone: "+43 664 123 4567",
  address: "Dorfstraße 12, 6020 Innsbruck",
};

interface TemplatePreviewDialogProps {
  name: string;
  type: MessageType;
  subject: string | null;
  body: string;
  trigger?: React.ReactNode;
}

export function TemplatePreviewDialog({
  name,
  type,
  subject,
  body,
  trigger,
}: TemplatePreviewDialogProps) {
  const [open, setOpen] = React.useState(false);

  const renderedSubject = subject ? renderTemplate(subject, DEMO_VARS) : null;
  const renderedBody = renderTemplate(body, DEMO_VARS);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4" />
      Preview
    </Button>
  );

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger ?? defaultTrigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="truncate">{name}</DialogTitle>
            <DialogDescription>
              {MESSAGE_TYPE_LABELS[type]} — preview with demo data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {renderedSubject && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{renderedSubject}</p>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Message body</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{renderedBody}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Preview uses sample data. Variables in the actual message will be replaced with real
              guest and property information.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <CopyButton value={renderedBody} label="Copy message" />
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
