"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil, Info } from "lucide-react";
import type { MessageChannel, MessageType, Locale } from "@prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { MESSAGE_TYPE_LABELS, MESSAGE_VARIABLES, LOCALE_LABELS, LOCALES } from "@/lib/constants";
import { createTemplateAction, updateTemplateAction } from "@/server/message-templates";
import type { TemplateActionState } from "@/server/message-templates";

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  MANUAL: "Manual / copy",
  EMAIL: "Email",
  SMS: "SMS",
};

interface TemplateFormDialogProps {
  mode: "create" | "edit";
  template?: {
    id: string;
    name: string;
    type: MessageType;
    locale: Locale;
    channel: MessageChannel;
    subject: string | null;
    body: string;
    propertyId: string | null;
  };
  properties: { id: string; publicName: string }[];
  trigger?: React.ReactNode;
}

export function TemplateFormDialog({
  mode,
  template,
  properties,
  trigger,
}: TemplateFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const action = mode === "create" ? createTemplateAction : updateTemplateAction;
  const [state, dispatch, isPending] = useActionState(
    async (prev: TemplateActionState, formData: FormData) => {
      const result = await action(prev, formData);
      return result;
    },
    undefined,
  );

  // Close on success and show toast.
  React.useEffect(() => {
    if (state?.success) {
      toast({
        title: mode === "create" ? "Template created" : "Template updated",
        description: mode === "create"
          ? "Your message template has been saved."
          : "Changes saved successfully.",
      });
      setOpen(false);
    }
  }, [state?.success, mode, toast]);

  const defaultTrigger = mode === "create" ? (
    <Button>
      <Plus /> New template
    </Button>
  ) : (
    <Button variant="ghost" size="icon">
      <Pencil className="h-4 w-4" />
      <span className="sr-only">Edit template</span>
    </Button>
  );

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger ?? defaultTrigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New message template" : "Edit template"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a reusable message template for guests. Use {{variable}} placeholders for dynamic content."
                : "Update the template content and settings."}
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-5">
            {mode === "edit" && template && (
              <input type="hidden" name="templateId" value={template.id} />
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                name="name"
                placeholder="e.g. Pre-arrival welcome (English)"
                defaultValue={template?.name ?? ""}
                required
              />
            </div>

            {/* Type + Locale row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Message type</Label>
                <Select name="type" defaultValue={template?.type ?? "BOOKING_CONFIRMATION"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(MESSAGE_TYPE_LABELS) as [MessageType, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select name="locale" defaultValue={template?.locale ?? "EN"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => {
                      const l = LOCALE_LABELS[locale];
                      return (
                        <SelectItem key={locale} value={locale}>
                          {l.flag} {l.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Channel + Property row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select name="channel" defaultValue={template?.channel ?? "MANUAL"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CHANNEL_LABELS) as [MessageChannel, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property (optional — leave blank for org-wide)</Label>
                <Select name="propertyId" defaultValue={template?.propertyId ?? "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="All properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All properties (org-wide)</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.publicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Subject (optional, for email)</Label>
              <Input
                id="tpl-subject"
                name="subject"
                placeholder="e.g. Your stay at {{property_name}} — what you need to know"
                defaultValue={template?.subject ?? ""}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="tpl-body">Message body</Label>
              <Textarea
                id="tpl-body"
                name="body"
                placeholder="Hi {{guest_name}}, we're looking forward to welcoming you to {{property_name}}..."
                defaultValue={template?.body ?? ""}
                rows={8}
                className="font-mono text-xs"
                required
              />
            </div>

            {/* Variable reference */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Available variables — wrap in {"{{ }}"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MESSAGE_VARIABLES.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-background px-1.5 py-0.5 text-[11px] font-mono border"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton pendingText={mode === "create" ? "Creating…" : "Saving…"}>
                {mode === "create" ? "Create template" : "Save changes"}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
