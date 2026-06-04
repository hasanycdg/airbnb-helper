"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil } from "lucide-react";
import type { Recommendation, RecommendationCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import {
  createRecommendation,
  updateRecommendation,
  type RecommendationState,
} from "@/server/recommendations";

interface RecommendationFormDialogProps {
  mode: "create" | "edit";
  propertyId: string;
  recommendation?: Recommendation;
  trigger?: React.ReactNode;
}

export function RecommendationFormDialog({
  mode,
  propertyId,
  recommendation,
  trigger,
}: RecommendationFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const action = mode === "create" ? createRecommendation : updateRecommendation;

  const [state, dispatch] = useActionState(
    async (prev: RecommendationState, formData: FormData) => {
      const result = await action(prev, formData);
      return result;
    },
    undefined,
  );

  React.useEffect(() => {
    if (state?.success) {
      toast({
        title: mode === "create" ? "Recommendation added" : "Recommendation updated",
        description:
          mode === "create"
            ? "The recommendation has been saved."
            : "Changes saved successfully.",
      });
      setOpen(false);
    }
  }, [state?.success, mode, toast]);

  const defaultTrigger =
    mode === "create" ? (
      <Button>
        <Plus /> Add recommendation
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit recommendation</span>
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
              {mode === "create" ? "Add recommendation" : "Edit recommendation"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a local recommendation that will appear in the guest guide."
                : "Update the details for this recommendation."}
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-5">
            <input type="hidden" name="propertyId" value={propertyId} />
            {mode === "edit" && recommendation && (
              <input type="hidden" name="recommendationId" value={recommendation.id} />
            )}

            {/* Category + Title */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rec-category">Category</Label>
                <Select
                  name="category"
                  defaultValue={recommendation?.category ?? "OTHER"}
                >
                  <SelectTrigger id="rec-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(RECOMMENDATION_CATEGORY_LABELS) as [
                        RecommendationCategory,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-title">Name / title</Label>
                <Input
                  id="rec-title"
                  name="title"
                  placeholder="e.g. Cafe Sonnenhang"
                  defaultValue={recommendation?.title ?? ""}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="rec-description">Description</Label>
              <Textarea
                id="rec-description"
                name="description"
                placeholder="A short description shown to guests."
                defaultValue={recommendation?.description ?? ""}
                rows={3}
              />
            </div>

            {/* Address + Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rec-address">Address</Label>
                <Input
                  id="rec-address"
                  name="address"
                  placeholder="Hauptstraße 12, 6370 Kitzbühel"
                  defaultValue={recommendation?.address ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-phone">Phone</Label>
                <Input
                  id="rec-phone"
                  name="phone"
                  type="tel"
                  placeholder="+43 123 456789"
                  defaultValue={recommendation?.phone ?? ""}
                />
              </div>
            </div>

            {/* Website + Map URL */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rec-website">Website</Label>
                <Input
                  id="rec-website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  defaultValue={recommendation?.website ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-mapUrl">Map URL (Google Maps / Apple Maps)</Label>
                <Input
                  id="rec-mapUrl"
                  name="mapUrl"
                  type="url"
                  placeholder="https://maps.google.com/…"
                  defaultValue={recommendation?.mapUrl ?? ""}
                />
              </div>
            </div>

            {/* Opening hours + Image URL */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rec-openingHours">Opening hours</Label>
                <Input
                  id="rec-openingHours"
                  name="openingHours"
                  placeholder="Mon–Sun 08:00–22:00"
                  defaultValue={recommendation?.openingHours ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-imageUrl">Image URL</Label>
                <Input
                  id="rec-imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://…/image.jpg"
                  defaultValue={recommendation?.imageUrl ?? ""}
                />
              </div>
            </div>

            {/* Host note */}
            <div className="space-y-2">
              <Label htmlFor="rec-hostNote">Host note (visible to guests)</Label>
              <Textarea
                id="rec-hostNote"
                name="hostNote"
                placeholder="Our personal tip: ask for the daily special!"
                defaultValue={recommendation?.hostNote ?? ""}
                rows={2}
              />
            </div>

            {/* Affiliate tag */}
            <div className="space-y-2">
              <Label htmlFor="rec-affiliateTag">Affiliate / referral tag (optional)</Label>
              <Input
                id="rec-affiliateTag"
                name="affiliateTag"
                placeholder="ref=stayguide-abc123"
                defaultValue={recommendation?.affiliateTag ?? ""}
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton pendingText={mode === "create" ? "Adding…" : "Saving…"}>
                {mode === "create" ? "Add recommendation" : "Save changes"}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
