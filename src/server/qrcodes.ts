"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { QRCodeType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type QrCodeActionState = { error?: string; success?: boolean } | undefined;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique URL-safe token that doesn't collide with existing ones. */
async function uniqueToken(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const token = nanoid(10);
    const exists = await db.qRCode.findUnique({ where: { token } });
    if (!exists) return token;
  }
  return nanoid(16);
}

/** Verify the QR code belongs to a property that belongs to the org. */
async function loadOwnedQrCode(qrId: string, orgId: string) {
  return db.qRCode.findFirst({
    where: {
      id: qrId,
      property: { organizationId: orgId },
    },
    include: { property: { select: { id: true, slug: true } } },
  });
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  propertyId: z.string().min(1),
  type: z.enum([
    "FULL_GUIDE",
    "WIFI",
    "HEATING",
    "PARKING",
    "TRASH",
    "CHECKOUT",
    "ISSUE_REPORT",
    "RECOMMENDATIONS",
    "SECTION",
  ] as const),
  sectionId: z.string().optional(),
  label: z.string().max(120).optional(),
});

const updateLabelSchema = z.object({
  qrId: z.string().min(1),
  label: z.string().max(120),
});

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Build the public targetPath for a QR code.
 * - FULL_GUIDE           → /g/<slug>
 * - WIFI / HEATING / etc → /g/<slug>#<section-anchor>
 * - ISSUE_REPORT         → /g/<slug>/report
 * - RECOMMENDATIONS      → /g/<slug>#recommendations
 * - SECTION              → /g/<slug>#<sectionSlug>
 */
async function buildTargetPath(
  type: QRCodeType,
  propertySlug: string,
  sectionSlug?: string | null,
): Promise<string> {
  const base = `/g/${propertySlug}`;

  const TYPE_ANCHOR: Partial<Record<QRCodeType, string>> = {
    WIFI: "wifi",
    HEATING: "heating",
    PARKING: "parking",
    TRASH: "trash",
    CHECKOUT: "checkout",
    RECOMMENDATIONS: "recommendations",
  };

  if (type === "FULL_GUIDE") return base;
  if (type === "ISSUE_REPORT") return `${base}/report`;
  if (type === "SECTION" && sectionSlug) return `${base}#${sectionSlug}`;

  const anchor = TYPE_ANCHOR[type];
  if (anchor) return `${base}#${anchor}`;

  // Fallback to full guide
  return base;
}

export async function createQrCodeAction(
  _prev: QrCodeActionState,
  formData: FormData,
): Promise<QrCodeActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = createSchema.safeParse({
    propertyId: formData.get("propertyId"),
    type: formData.get("type"),
    sectionId: formData.get("sectionId") || undefined,
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { propertyId, type, sectionId, label } = parsed.data;

  // Org-scope the property lookup.
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true, slug: true },
  });
  if (!property) return { error: "Property not found." };

  // For SECTION type we need the section's slug.
  let resolvedSectionId: string | null = null;
  let sectionSlug: string | null = null;

  if (type === "SECTION") {
    if (!sectionId) return { error: "Please select a section for this QR code type." };

    const section = await db.guideSection.findFirst({
      where: { id: sectionId, propertyId: property.id },
      select: { id: true, slug: true },
    });
    if (!section) return { error: "Section not found." };

    resolvedSectionId = section.id;
    sectionSlug = section.slug;
  }

  const targetPath = await buildTargetPath(type, property.slug, sectionSlug);
  const token = await uniqueToken();

  const qrCode = await db.qRCode.create({
    data: {
      propertyId: property.id,
      type,
      token,
      label: label?.trim() || null,
      targetPath,
      sectionId: resolvedSectionId,
    },
  });

  await audit({
    action: "qrcode.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "QRCode",
    targetId: qrCode.id,
  });

  revalidatePath(`/properties/${propertyId}/qr`);
  return { success: true };
}

export async function updateQrLabelAction(
  _prev: QrCodeActionState,
  formData: FormData,
): Promise<QrCodeActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = updateLabelSchema.safeParse({
    qrId: formData.get("qrId"),
    label: formData.get("label"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { qrId, label } = parsed.data;

  const qrCode = await loadOwnedQrCode(qrId, ctx.organization.id);
  if (!qrCode) return { error: "QR code not found." };

  await db.qRCode.update({
    where: { id: qrId },
    data: { label: label.trim() || null },
  });

  revalidatePath(`/properties/${qrCode.property.id}/qr`);
  return { success: true };
}

export async function regenerateQrCodeAction(
  _prev: QrCodeActionState,
  formData: FormData,
): Promise<QrCodeActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const qrId = String(formData.get("qrId") || "");
  if (!qrId) return { error: "Missing QR code ID." };

  const qrCode = await loadOwnedQrCode(qrId, ctx.organization.id);
  if (!qrCode) return { error: "QR code not found." };

  const newToken = await uniqueToken();

  await db.qRCode.update({
    where: { id: qrId },
    data: {
      token: newToken,
      scanCount: 0,
    },
  });

  await audit({
    action: "qrcode.regenerate",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "QRCode",
    targetId: qrId,
    metadata: { oldToken: qrCode.token, newToken },
  });

  revalidatePath(`/properties/${qrCode.property.id}/qr`);
  return { success: true };
}

export async function deleteQrCodeAction(
  _prev: QrCodeActionState,
  formData: FormData,
): Promise<QrCodeActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const qrId = String(formData.get("qrId") || "");
  if (!qrId) return { error: "Missing QR code ID." };

  const qrCode = await loadOwnedQrCode(qrId, ctx.organization.id);
  if (!qrCode) return { error: "QR code not found." };

  const propertyId = qrCode.property.id;

  await db.qRCode.delete({ where: { id: qrId } });

  await audit({
    action: "qrcode.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "QRCode",
    targetId: qrId,
  });

  revalidatePath(`/properties/${propertyId}/qr`);
  return { success: true };
}
