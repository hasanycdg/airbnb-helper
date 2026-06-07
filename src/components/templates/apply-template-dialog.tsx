"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { applyTemplateToProperty } from "@/server/templates";
import type { TemplateContent } from "@/components/templates/template-data";

interface Property {
  id: string;
  publicName: string;
}

interface Props {
  template: TemplateContent;
  properties: Property[];
}

export function ApplyTemplateDialog({ template, properties }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id ?? "",
  );
  const [baseLocale, setBaseLocale] = useState<"DE" | "EN">("DE");

  const { toast } = useToast();
  const [state, formAction] = useActionState(applyTemplateToProperty, undefined);

  // React to server action result.
  useEffect(() => {
    if (!state) return;
    if (state.success) {
      const langs = (state.locales ?? []).join(", ");
      toast({
        title: "Template applied",
        description: `"${template.title}" was added${langs ? ` in ${langs}` : ""}. Open the guide builder to customise it.`,
      });
      setOpen(false);
    }
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Could not apply template",
        description: state.error,
      });
    }
  }, [state, template.title, toast]);

  const hasProperties = properties.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="shrink-0">
          Apply to property
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply template: {template.title}</DialogTitle>
          <DialogDescription>
            This will create or update a guide section with Tirol/DACH starting-point content.
            Review and edit it in the Guide Builder before publishing.
          </DialogDescription>
        </DialogHeader>

        {!hasProperties ? (
          <p className="text-sm text-muted-foreground">
            You have no properties yet. Create one first and then apply templates.
          </p>
        ) : (
          <form action={formAction} className="space-y-4 pt-1">
            {/* Hidden fields */}
            <input type="hidden" name="templateKey" value={template.key} />

            {/* Property selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="property-select"
                className="text-sm font-medium leading-none"
              >
                Property
              </label>
              <Select
                name="propertyId"
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger id="property-select">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.publicName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                An existing section of the same type will be overwritten with the template content.
              </p>
            </div>

            {/* Base language selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="locale-select"
                className="text-sm font-medium leading-none"
              >
                Primary language
              </label>
              <Select
                name="baseLocale"
                value={baseLocale}
                onValueChange={(v) => setBaseLocale(v as "DE" | "EN")}
              >
                <SelectTrigger id="locale-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DE">German (Deutsch)</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This becomes the main guide content. Every other language your property
                supports is filled in automatically — built-in text for German &amp; English,
                AI translation for the rest.
              </p>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Templates are editable starting points. Rules vary by municipality — please
                customise the text before publishing to your guests.
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
              <SubmitButton pendingText="Applying…">Apply template</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
