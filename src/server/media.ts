"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Locale, MediaType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";
import { createUploadTarget, buildMediaKey } from "@/lib/storage";
import { canUploadVideo } from "@/lib/usage";
import { rewriteInstructions } from "@/lib/ai";

export type MediaActionState = { error?: string; success?: boolean; content?: string } | undefined;

export type UploadTarget = {
  mode: "s3" | "local";
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export type RequestUploadResult =
  | { ok: true; target: UploadTarget }
  | { ok: false; error: string };

/** Scope-checks a GuideMedia record to the org. Returns null if not found. */
async function loadOwnedMedia(mediaId: string, orgId: string) {
  return db.guideMedia.findFirst({
    where: { id: mediaId, property: { organizationId: orgId } },
    include: { property: { select: { id: true } } },
  });
}

// ── requestUpload ─────────────────────────────────────────────────────────────

const requestUploadSchema = z.object({
  propertyId: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  mediaType: z.enum(["IMAGE", "VIDEO", "PDF", "FILE"]),
});

/**
 * Returns a presigned S3 PUT URL (or local upload URL). The client PUTs the
 * file directly, then calls createMedia with the returned publicUrl.
 */
export async function requestUpload(
  _prev: RequestUploadResult | undefined,
  formData: FormData,
): Promise<RequestUploadResult> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = requestUploadSchema.safeParse({
    propertyId: formData.get("propertyId"),
    fileName: formData.get("fileName"),
    contentType: formData.get("contentType"),
    mediaType: formData.get("mediaType"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { propertyId, fileName, contentType, mediaType } = parsed.data;

  // Verify property belongs to org.
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { ok: false, error: "Property not found." };

  // Enforce video limit.
  if (mediaType === "VIDEO") {
    const plan = ctx.organization.subscription?.plan ?? "TRIAL";
    const check = await canUploadVideo(propertyId, plan);
    if (!check.allowed) return { ok: false, error: check.reason ?? "Video limit reached." };
  }

  const key = buildMediaKey(ctx.organization.id, propertyId, fileName);
  const { mode, uploadUrl, publicUrl } = await createUploadTarget(key, contentType);

  return { ok: true, target: { mode, uploadUrl, publicUrl, key } };
}

// ── createMedia ───────────────────────────────────────────────────────────────

const createMediaSchema = z.object({
  propertyId: z.string().min(1),
  url: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.coerce.number().int().optional(),
  mimeType: z.string().optional(),
  durationSeconds: z.coerce.number().int().optional(),
  title: z.string().optional(),
  topic: z.string().optional(),
  type: z.enum(["IMAGE", "VIDEO", "PDF", "FILE"]),
});

export async function createMedia(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = createMediaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { propertyId } = parsed.data;

  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { error: "Property not found." };

  const count = await db.guideMedia.count({ where: { propertyId } });

  const media = await db.guideMedia.create({
    data: {
      propertyId,
      type: parsed.data.type as MediaType,
      url: parsed.data.url,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      fileName: parsed.data.fileName ?? null,
      fileSize: parsed.data.fileSize ?? null,
      mimeType: parsed.data.mimeType ?? null,
      durationSeconds: parsed.data.durationSeconds ?? null,
      title: parsed.data.title?.trim() || null,
      topic: parsed.data.topic?.trim() || null,
      order: count,
    },
  });

  await audit({
    action: "media.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideMedia",
    targetId: media.id,
    metadata: { type: media.type, fileName: media.fileName },
  });

  await trackEvent({
    organizationId: ctx.organization.id,
    type: "MEDIA_PLAY",
    propertyId,
    metadata: { action: "upload", mediaId: media.id, mediaType: media.type },
  });

  revalidatePath(`/properties/${propertyId}/media`);
  return { success: true };
}

// ── updateMedia ───────────────────────────────────────────────────────────────

const updateMediaSchema = z.object({
  mediaId: z.string().min(1),
  title: z.string().optional(),
  topic: z.string().optional(),
  transcript: z.string().optional(),
});

export async function updateMedia(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = updateMediaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { mediaId } = parsed.data;
  const media = await loadOwnedMedia(mediaId, ctx.organization.id);
  if (!media) return { error: "Media not found." };

  await db.guideMedia.update({
    where: { id: mediaId },
    data: {
      title: parsed.data.title?.trim() || null,
      topic: parsed.data.topic?.trim() || null,
      transcript: parsed.data.transcript ?? null,
    },
  });

  revalidatePath(`/properties/${media.property.id}/media`);
  return { success: true };
}

// ── attachToSections ──────────────────────────────────────────────────────────

const attachSchema = z.object({
  mediaId: z.string().min(1),
  sectionIds: z.string(), // JSON array of section IDs
});

export async function attachToSections(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = attachSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { mediaId } = parsed.data;
  const media = await loadOwnedMedia(mediaId, ctx.organization.id);
  if (!media) return { error: "Media not found." };

  let sectionIds: string[];
  try {
    sectionIds = JSON.parse(parsed.data.sectionIds) as string[];
    if (!Array.isArray(sectionIds)) throw new Error();
  } catch {
    return { error: "Invalid section list." };
  }

  // Verify all sections belong to the same property.
  if (sectionIds.length > 0) {
    const owned = await db.guideSection.count({
      where: { id: { in: sectionIds }, propertyId: media.property.id },
    });
    if (owned !== sectionIds.length) return { error: "One or more sections not found." };
  }

  await db.guideMedia.update({
    where: { id: mediaId },
    data: {
      sections: {
        set: sectionIds.map((id) => ({ id })),
      },
    },
  });

  await audit({
    action: "media.attach",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideMedia",
    targetId: mediaId,
    metadata: { sectionIds },
  });

  revalidatePath(`/properties/${media.property.id}/media`);
  return { success: true };
}

// ── deleteMedia ───────────────────────────────────────────────────────────────

export async function deleteMedia(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const mediaId = String(formData.get("mediaId") ?? "");

  const media = await loadOwnedMedia(mediaId, ctx.organization.id);
  if (!media) return;

  const propertyId = media.property.id;
  await db.guideMedia.delete({ where: { id: mediaId } });

  await audit({
    action: "media.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideMedia",
    targetId: mediaId,
  });

  revalidatePath(`/properties/${propertyId}/media`);
}

// ── generateInstructionsFromTranscript ────────────────────────────────────────

export async function generateInstructionsFromTranscript(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const mediaId = String(formData.get("mediaId") ?? "");

  const media = await loadOwnedMedia(mediaId, ctx.organization.id);
  if (!media) return { error: "Media not found." };
  if (!media.transcript?.trim()) return { error: "No transcript available to generate from." };

  const property = await db.property.findFirst({
    where: { id: media.property.id },
    select: { baseLocale: true },
  });

  const locale: Locale = property?.baseLocale ?? "EN";
  const result = await rewriteInstructions(media.transcript, locale);

  return { success: true, content: result };
}
