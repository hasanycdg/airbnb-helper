import { notFound } from "next/navigation";
import { QrCode, ScanLine } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { generateQrDataUrl, generateQrSvg, qrShortUrl } from "@/lib/qr";
import { QR_CODE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { CreateQrDialog } from "@/components/qr/create-qr-dialog";
import { QrCard } from "@/components/qr/qr-card";
import { PrintableQrCard } from "@/components/qr/printable-qr-card";
import { PrintAllButtonClient } from "@/components/qr/print-all-button";
import type { QrCardData } from "@/components/qr/qr-card";

export default async function PropertyQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  // Org-scope the property lookup.
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true, publicName: true, slug: true },
  });
  if (!property) notFound();

  // Fetch all QR codes for this property.
  const qrCodes = await db.qRCode.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "asc" },
  });

  // Fetch guide sections so the create dialog can offer them.
  const sections = await db.guideSection.findMany({
    where: { propertyId: property.id },
    orderBy: { order: "asc" },
    select: { id: true, title: true, slug: true },
  });

  // Pre-generate QR images on the server — client receives plain data URLs.
  const qrCardData: QrCardData[] = await Promise.all(
    qrCodes.map(async (qr) => {
      const shortUrl = qrShortUrl(qr.token);
      const [dataUrl, svgContent] = await Promise.all([
        generateQrDataUrl(shortUrl),
        generateQrSvg(shortUrl),
      ]);
      return {
        id: qr.id,
        type: qr.type,
        token: qr.token,
        label: qr.label,
        targetPath: qr.targetPath,
        scanCount: qr.scanCount,
        shortUrl,
        dataUrl,
        svgContent,
      };
    }),
  );

  const totalScans = qrCodes.reduce((sum, q) => sum + q.scanCount, 0);
  const canManage = can(ctx.role, "qr:manage");

  return (
    <div className="space-y-6">
      {/* Renders only in print mode via @media print */}
      <PrintableQrCard
        propertyName={property.publicName}
        items={qrCardData.map((q) => ({
          id: q.id,
          type: q.type,
          token: q.token,
          label: q.label,
          shortUrl: q.shortUrl,
          dataUrl: q.dataUrl,
        }))}
      />

      <PageHeader
        title="QR codes"
        description={`Manage printable QR codes for ${property.publicName}. Guests scan them to reach the right section instantly.`}
      >
        {canManage && qrCodes.length > 0 && <PrintAllButtonClient />}
        {canManage && (
          <CreateQrDialog propertyId={property.id} sections={sections} />
        )}
      </PageHeader>

      {/* Stats row — shown only when there is at least one code */}
      {qrCodes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total QR codes" value={qrCodes.length} icon={QrCode} />
          <StatCard
            label="Total scans"
            value={totalScans.toLocaleString()}
            icon={ScanLine}
          />
          <StatCard
            label="Unique types"
            value={new Set(qrCodes.map((q) => q.type)).size}
            icon={QrCode}
            hint={`of ${Object.keys(QR_CODE_LABELS).length} available`}
          />
        </div>
      )}

      {/* QR code grid */}
      {qrCardData.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No QR codes yet"
          description="Create your first QR code and place it around the property so guests can quickly access the right information."
          action={
            canManage ? (
              <CreateQrDialog propertyId={property.id} sections={sections} />
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCardData.map((qr) => (
            <QrCard key={qr.id} qr={qr} propertyId={property.id} />
          ))}
        </div>
      )}
    </div>
  );
}
