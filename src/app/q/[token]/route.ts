import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";

/**
 * Scan-tracked QR short link. Increments the scan counter, logs a QR_SCAN
 * analytics event, then redirects to the encoded target path.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const qr = await db.qRCode.findUnique({
    where: { token },
    include: { property: { select: { organizationId: true, slug: true } } },
  });

  if (!qr) return NextResponse.redirect(new URL("/", env.appUrl));

  await db.qRCode.update({ where: { id: qr.id }, data: { scanCount: { increment: 1 } } });
  await trackEvent({
    organizationId: qr.property.organizationId,
    propertyId: qr.propertyId,
    type: "QR_SCAN",
    qrCodeId: qr.id,
    sectionId: qr.sectionId,
    metadata: { qrType: qr.type },
  });

  const target = qr.targetPath.startsWith("http") ? qr.targetPath : `${env.appUrl}${qr.targetPath}`;
  return NextResponse.redirect(target);
}
