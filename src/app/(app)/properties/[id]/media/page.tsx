import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Images } from "lucide-react";
import type { MediaType } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { getPlanLimits } from "@/lib/plans";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaStats } from "@/components/media/media-stats";
import { UploadDialog } from "@/components/media/upload-dialog";
import { MediaFilterBar } from "@/components/media/media-filter-bar";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function PropertyMediaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { type } = await searchParams;

  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const canManage = can(ctx.role, "media:manage");

  // Org-scoped property check.
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true, publicName: true },
  });
  if (!property) notFound();

  // Build type filter.
  const validTypes: MediaType[] = ["IMAGE", "VIDEO", "PDF", "FILE"];
  const typeFilter =
    type && validTypes.includes(type as MediaType) ? (type as MediaType) : undefined;

  // Load all media for the property (org-scoped via property).
  const allMedia = await db.guideMedia.findMany({
    where: { propertyId: id },
    include: { sections: { select: { id: true, title: true } } },
    orderBy: { order: "asc" },
  });

  const displayMedia = typeFilter ? allMedia.filter((m) => m.type === typeFilter) : allMedia;

  // Load sections for the attach dialog.
  const sections = await db.guideSection.findMany({
    where: { propertyId: id },
    select: { id: true, title: true },
    orderBy: { order: "asc" },
  });

  // Determine video limit for the current plan.
  const plan = ctx.organization.subscription?.plan ?? "TRIAL";
  const limits = getPlanLimits(plan);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media library"
        description="Images, videos and files for this property's guest guide."
      >
        {canManage && <UploadDialog propertyId={property.id} />}
      </PageHeader>

      {/* Stats row */}
      <MediaStats mediaList={allMedia} videoLimit={limits.videosPerProperty} />

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {displayMedia.length === 0
            ? "No media"
            : `${displayMedia.length} item${displayMedia.length !== 1 ? "s" : ""}`}
          {typeFilter ? ` · filtered by ${typeFilter.toLowerCase()}` : ""}
        </p>
        <Suspense fallback={null}>
          <MediaFilterBar />
        </Suspense>
      </div>

      {/* Grid */}
      {displayMedia.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No media yet"
          description={
            typeFilter
              ? `No ${typeFilter.toLowerCase()} files uploaded for this property yet.`
              : "Upload images, videos and files to attach them to guide sections."
          }
          action={canManage ? <UploadDialog propertyId={property.id} /> : undefined}
        />
      ) : (
        <MediaGrid mediaList={displayMedia} allSections={sections} />
      )}
    </div>
  );
}
