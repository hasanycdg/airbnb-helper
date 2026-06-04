import type { Recommendation } from "@prisma/client";
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";

interface RecommendationCategoryGroupProps {
  category: string;
  recommendations: Recommendation[];
  /** Index of the first item in this group within the global sorted list. */
  globalStartIndex: number;
  globalTotal: number;
}

export function RecommendationCategoryGroup({
  category,
  recommendations,
  globalStartIndex,
  globalTotal,
}: RecommendationCategoryGroupProps) {
  const label =
    RECOMMENDATION_CATEGORY_LABELS[
      category as keyof typeof RECOMMENDATION_CATEGORY_LABELS
    ] ?? category;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const absoluteIndex = globalStartIndex + i;
          return (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isFirst={absoluteIndex === 0}
              isLast={absoluteIndex === globalTotal - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
