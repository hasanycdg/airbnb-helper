"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { RecommendationCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type RecommendationState = { error?: string; success?: boolean } | undefined;

// ── Zod schema ────────────────────────────────────────────────────────────────

const recommendationSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().optional(),
  address: z.string().optional(),
  mapUrl: z.string().url("Map URL must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Website must be a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
  hostNote: z.string().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional().or(z.literal("")),
  affiliateTag: z.string().optional(),
  order: z.coerce.number().int().min(0).optional(),
  isVisible: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Validate the property belongs to the org; returns the property or null. */
async function loadOwnedProperty(propertyId: string, orgId: string) {
  return db.property.findFirst({
    where: { id: propertyId, organizationId: orgId },
    select: { id: true },
  });
}

/** Validate the recommendation belongs to a property in the org. */
async function loadOwnedRecommendation(recommendationId: string, orgId: string) {
  return db.recommendation.findFirst({
    where: {
      id: recommendationId,
      property: { organizationId: orgId },
    },
    include: { property: { select: { id: true } } },
  });
}

function revalidate(propertyId: string) {
  revalidatePath(`/properties/${propertyId}/recommendations`);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createRecommendation(
  _prev: RecommendationState,
  formData: FormData,
): Promise<RecommendationState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId") ?? "");

  const property = await loadOwnedProperty(propertyId, ctx.organization.id);
  if (!property) return { error: "Property not found." };

  const parsed = recommendationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  // Next order = max + 1
  const last = await db.recommendation.findFirst({
    where: { propertyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const rec = await db.recommendation.create({
    data: {
      propertyId,
      category: d.category as RecommendationCategory,
      title: d.title.trim(),
      description: d.description?.trim() || null,
      address: d.address?.trim() || null,
      mapUrl: d.mapUrl || null,
      website: d.website || null,
      phone: d.phone?.trim() || null,
      openingHours: d.openingHours?.trim() || null,
      hostNote: d.hostNote?.trim() || null,
      imageUrl: d.imageUrl || null,
      affiliateTag: d.affiliateTag?.trim() || null,
      order: d.order ?? (last ? last.order + 1 : 0),
      isVisible: d.isVisible !== "false",
    },
  });

  await audit({
    action: "recommendation.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Recommendation",
    targetId: rec.id,
  });

  revalidate(propertyId);
  return { success: true };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateRecommendation(
  _prev: RecommendationState,
  formData: FormData,
): Promise<RecommendationState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const recId = String(formData.get("recommendationId") ?? "");

  const rec = await loadOwnedRecommendation(recId, ctx.organization.id);
  if (!rec) return { error: "Recommendation not found." };

  const parsed = recommendationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  await db.recommendation.update({
    where: { id: recId },
    data: {
      category: d.category as RecommendationCategory,
      title: d.title.trim(),
      description: d.description?.trim() || null,
      address: d.address?.trim() || null,
      mapUrl: d.mapUrl || null,
      website: d.website || null,
      phone: d.phone?.trim() || null,
      openingHours: d.openingHours?.trim() || null,
      hostNote: d.hostNote?.trim() || null,
      imageUrl: d.imageUrl || null,
      affiliateTag: d.affiliateTag?.trim() || null,
      isVisible: d.isVisible !== "false",
    },
  });

  await audit({
    action: "recommendation.update",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Recommendation",
    targetId: recId,
  });

  revalidate(rec.property.id);
  return { success: true };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteRecommendation(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const recId = String(formData.get("recommendationId") ?? "");

  const rec = await loadOwnedRecommendation(recId, ctx.organization.id);
  if (!rec) return;

  const propertyId = rec.property.id;

  await db.recommendation.delete({ where: { id: recId } });

  await audit({
    action: "recommendation.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Recommendation",
    targetId: recId,
  });

  revalidate(propertyId);
}

// ── Toggle visibility ─────────────────────────────────────────────────────────

export async function toggleVisibility(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const recId = String(formData.get("recommendationId") ?? "");

  const rec = await loadOwnedRecommendation(recId, ctx.organization.id);
  if (!rec) return;

  await db.recommendation.update({
    where: { id: recId },
    data: { isVisible: !rec.isVisible },
  });

  revalidate(rec.property.id);
}

// ── Reorder (swap up/down) ────────────────────────────────────────────────────

export async function reorderRecommendation(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const recId = String(formData.get("recommendationId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const rec = await loadOwnedRecommendation(recId, ctx.organization.id);
  if (!rec) return;

  const siblings = await db.recommendation.findMany({
    where: { propertyId: rec.property.id },
    orderBy: { order: "asc" },
  });

  const index = siblings.findIndex((r) => r.id === recId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  const a = siblings[index];
  const b = siblings[swapWith];

  await db.$transaction([
    db.recommendation.update({ where: { id: a.id }, data: { order: b.order } }),
    db.recommendation.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);

  revalidate(rec.property.id);
}
