"use client";

import * as React from "react";
import { useActionState } from "react";
import { Copy, Trash2 } from "lucide-react";
import type { MessageChannel, MessageType, Locale } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { TemplateFormDialog } from "@/components/messages/template-form-dialog";
import { TemplatePreviewDialog } from "@/components/messages/template-preview-dialog";
import {
  toggleTemplateEnabledAction,
  duplicateTemplateAction,
  deleteTemplateAction,
} from "@/server/message-templates";
import type { TemplateActionState } from "@/server/message-templates";

interface TemplateRowActionsProps {
  template: {
    id: string;
    name: string;
    type: MessageType;
    locale: Locale;
    channel: MessageChannel;
    subject: string | null;
    body: string;
    enabled: boolean;
    propertyId: string | null;
  };
  properties: { id: string; publicName: string }[];
}

export function TemplateRowActions({ template, properties }: TemplateRowActionsProps) {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // ── Toggle ────────────────────────────────────────────────────────────
  const [toggling, startToggle] = React.useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("templateId", template.id);
    startToggle(async () => {
      await toggleTemplateEnabledAction(formData);
    });
  }

  // ── Duplicate ─────────────────────────────────────────────────────────
  const [dupState, dupDispatch] = useActionState(
    async (prev: TemplateActionState, formData: FormData) => {
      return duplicateTemplateAction(prev, formData);
    },
    undefined,
  );

  React.useEffect(() => {
    if (dupState?.success) {
      toast({ title: "Template duplicated", description: "A copy has been created (disabled)." });
    }
    if (dupState?.error) {
      toast({ title: "Error", description: dupState.error, variant: "destructive" });
    }
  }, [dupState, toast]);

  // ── Delete ────────────────────────────────────────────────────────────
  const [delState, delDispatch] = useActionState(
    async (prev: TemplateActionState, formData: FormData) => {
      return deleteTemplateAction(prev, formData);
    },
    undefined,
  );

  React.useEffect(() => {
    if (delState?.success) {
      toast({ title: "Template deleted" });
      setDeleteOpen(false);
    }
    if (delState?.error) {
      toast({ title: "Error", description: delState.error, variant: "destructive" });
    }
  }, [delState, toast]);

  return (
    <div className="flex items-center gap-2">
      {/* Enable / disable toggle */}
      <Switch
        checked={template.enabled}
        onCheckedChange={handleToggle}
        disabled={toggling}
        aria-label={template.enabled ? "Disable template" : "Enable template"}
      />

      {/* Preview */}
      <TemplatePreviewDialog
        name={template.name}
        type={template.type}
        subject={template.subject}
        body={template.body}
      />

      {/* Edit */}
      <TemplateFormDialog mode="edit" template={template} properties={properties} />

      {/* Duplicate */}
      <form action={dupDispatch}>
        <input type="hidden" name="templateId" value={template.id} />
        <Button type="submit" variant="ghost" size="icon" title="Duplicate template">
          <Copy className="h-4 w-4" />
          <span className="sr-only">Duplicate</span>
        </Button>
      </form>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        title="Delete template"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">Delete</span>
      </Button>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{template.name}</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={delDispatch}>
            <input type="hidden" name="templateId" value={template.id} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <SubmitButton variant="destructive" pendingText="Deleting…">
                Delete
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
