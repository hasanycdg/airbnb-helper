"use client";

import { useTransition } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Globe,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import type { Recommendation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import {
  deleteRecommendation,
  toggleVisibility,
  reorderRecommendation,
} from "@/server/recommendations";
import { RecommendationFormDialog } from "@/components/recommendations/recommendation-form-dialog";

interface RecommendationCardProps {
  recommendation: Recommendation;
  isFirst: boolean;
  isLast: boolean;
}

export function RecommendationCard({
  recommendation: rec,
  isFirst,
  isLast,
}: RecommendationCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleReorder(direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("recommendationId", rec.id);
      fd.set("direction", direction);
      await reorderRecommendation(fd);
    });
  }

  function handleToggleVisibility() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("recommendationId", rec.id);
      await toggleVisibility(fd);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${rec.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("recommendationId", rec.id);
      await deleteRecommendation(fd);
    });
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-opacity sm:flex-row sm:items-start",
        !rec.isVisible && "opacity-60",
        isPending && "pointer-events-none opacity-50",
      )}
    >
      {/* Reorder buttons */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleReorder("up")}
          disabled={isFirst || isPending}
          title="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleReorder("down")}
          disabled={isLast || isPending}
          title="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnail */}
      {rec.imageUrl && (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted sm:h-20 sm:w-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rec.imageUrl}
            alt={rec.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {RECOMMENDATION_CATEGORY_LABELS[rec.category]}
          </Badge>
          {!rec.isVisible && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>

        <p className="font-medium leading-snug">{rec.title}</p>

        {rec.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{rec.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {rec.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {rec.address}
            </span>
          )}
          {rec.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0" />
              {rec.phone}
            </span>
          )}
          {rec.openingHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              {rec.openingHours}
            </span>
          )}
          {rec.website && (
            <a
              href={rec.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-3 w-3 shrink-0" />
              Website
            </a>
          )}
        </div>

        {rec.hostNote && (
          <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Host note:</span> {rec.hostNote}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end">
        <RecommendationFormDialog
          mode="edit"
          propertyId={rec.propertyId}
          recommendation={rec}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleVisibility}
          disabled={isPending}
          title={rec.isVisible ? "Hide from guide" : "Show in guide"}
        >
          {rec.isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
          title="Delete recommendation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
