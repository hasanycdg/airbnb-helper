import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PropertyForm } from "@/components/properties/property-form";
import { PropertySidePanel } from "@/components/properties/property-side-panel";
import { CoverImageUploader } from "@/components/properties/cover-image-uploader";

export default async function PropertyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrg();
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
  });
  if (!property) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <PropertyForm property={property} />
      <div className="space-y-4">
        <CoverImageUploader propertyId={property.id} coverUrl={property.coverImageUrl} />
        <PropertySidePanel
          propertyId={property.id}
          publicUrl={`${env.appUrl}/g/${property.slug}`}
          isPublished={property.isPublished}
        />
      </div>
    </div>
  );
}
