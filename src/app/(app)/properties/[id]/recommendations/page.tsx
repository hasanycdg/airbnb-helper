import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import type { RecommendationCategory } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { RecommendationFormDialog } from "@/components/recommendations/recommendation-form-dialog";
import { RecommendationCategoryGroup } from "@/components/recommendations/recommendation-category-group";

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true, publicName: true },
  });
  if (!property) notFound();

  const recommendations = await db.recommendation.findMany({
    where: { propertyId: property.id },
    orderBy: { order: "asc" },
  });

  const canManage = can(ctx.role, "recommendations:manage");

  // Group by category, preserving order within each group
  const grouped = new Map<RecommendationCategory, typeof recommendations>();
  for (const rec of recommendations) {
    const existing = grouped.get(rec.category) ?? [];
    existing.push(rec);
    grouped.set(rec.category, existing);
  }

  // Preserve the order of categories as they first appear in the sorted list
  const categoryOrder = Array.from(grouped.keys());

  const visibleCount = recommendations.filter((r) => r.isVisible).length;
  const hiddenCount = recommendations.filter((r) => !r.isVisible).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        description="Local tips for restaurants, transport, activities and more — shown in the guest guide."
      >
        {canManage && (
          <RecommendationFormDialog mode="create" propertyId={property.id} />
        )}
      </PageHeader>

      {recommendations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total recommendations"
            value={recommendations.length}
            icon={Sparkles}
          />
          <StatCard label="Visible in guide" value={visibleCount} />
          <StatCard label="Hidden" value={hiddenCount} />
        </div>
      )}

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Add local tips to help guests discover great restaurants, activities, transport options and more."
          action={
            canManage ? (
              <RecommendationFormDialog mode="create" propertyId={property.id} />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {categoryOrder.map((category) => {
            const recs = grouped.get(category)!;
            // Compute global start index for accurate first/last detection
            const globalStartIndex = recommendations.findIndex(
              (r) => r.id === recs[0].id,
            );
            return (
              <RecommendationCategoryGroup
                key={category}
                category={category as string}
                recommendations={recs}
                globalStartIndex={globalStartIndex}
                globalTotal={recommendations.length}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
