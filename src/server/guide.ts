"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale, SectionType } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { SECTION_TYPE_MAP } from "@/lib/constants";
import { generateGuideDraft, translateContent } from "@/lib/ai";

export type SectionActionState = { error?: string; success?: boolean; content?: string } | undefined;

async function loadOwnedSection(sectionId: string, orgId: string) {
  return db.guideSection.findFirst({
    where: { id: sectionId, property: { organizationId: orgId } },
    include: { property: { select: { id: true, baseLocale: true } } },
  });
}

export async function createSectionAction(
  _prev: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId"));
  const type = String(formData.get("type") || "CUSTOM") as SectionType;
  const customTitle = String(formData.get("title") || "").trim();

  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { error: "Property not found." };

  const meta = SECTION_TYPE_MAP[type];
  const title = type === "CUSTOM" ? customTitle || "New section" : meta.label;
  let slug = type === "CUSTOM" ? slugify(title) || "section" : meta.slug;

  // Ensure slug is unique within the property.
  while (await db.guideSection.findFirst({ where: { propertyId, slug } })) {
    slug = `${slug}-${nanoid(3).toLowerCase()}`;
  }

  const count = await db.guideSection.count({ where: { propertyId } });
  const section = await db.guideSection.create({
    data: {
      propertyId,
      type,
      slug,
      title,
      icon: meta.lucide,
      order: count,
      isVisible: true,
      content: "",
    },
  });

  await audit({
    action: "section.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideSection",
    targetId: section.id,
  });
  redirect(`/properties/${propertyId}/guide/${section.id}`);
}

const updateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  shortDescription: z.string().optional(),
  content: z.string().optional(),
  mapEmbedUrl: z.string().optional(),
  internalNotes: z.string().optional(),
});

export async function updateSectionAction(
  _prev: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return { error: "Section not found." };

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.guideSection.update({
    where: { id: sectionId },
    data: {
      title: parsed.data.title.trim(),
      shortDescription: parsed.data.shortDescription || null,
      content: parsed.data.content || "",
      mapEmbedUrl: parsed.data.mapEmbedUrl || null,
      internalNotes: parsed.data.internalNotes || null,
    },
  });
  revalidatePath(`/properties/${section.property.id}/guide`);
  return { success: true };
}

export async function toggleSectionVisibilityAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return;
  await db.guideSection.update({
    where: { id: sectionId },
    data: { isVisible: !section.isVisible },
  });
  revalidatePath(`/properties/${section.property.id}/guide`);
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return;
  const propertyId = section.property.id;
  await db.guideSection.delete({ where: { id: sectionId } });
  revalidatePath(`/properties/${propertyId}/guide`);
}

export async function reorderSectionAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const direction = String(formData.get("direction"));
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return;

  const siblings = await db.guideSection.findMany({
    where: { propertyId: section.property.id },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === sectionId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  const a = siblings[index];
  const b = siblings[swapWith];
  await db.$transaction([
    db.guideSection.update({ where: { id: a.id }, data: { order: b.order } }),
    db.guideSection.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath(`/properties/${section.property.id}/guide`);
}

/** AI: draft a section from rough host notes; returns the text to the client. */
export async function generateDraftAction(
  _prev: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const notes = String(formData.get("notes") || "");
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return { error: "Section not found." };
  if (!notes.trim()) return { error: "Add a few notes first." };

  const draft = await generateGuideDraft(notes, section.title, section.property.baseLocale);
  return { content: draft };
}

export async function saveTranslationAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const sectionId = String(formData.get("sectionId"));
  const locale = String(formData.get("locale")) as Locale;
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const section = await loadOwnedSection(sectionId, ctx.organization.id);
  if (!section) return;

  for (const [field, value] of [["title", title], ["content", content]] as const) {
    await db.translation.upsert({
      where: {
        entityType_entityId_field_locale: {
          entityType: "GuideSection",
          entityId: sectionId,
          field,
          locale,
        },
      },
      create: { entityType: "GuideSection", entityId: sectionId, field, locale, value, isMachine: false },
      update: { value, isMachine: false },
    });
  }
  revalidatePath(`/properties/${section.property.id}/guide/${sectionId}`);
}

/**
 * AI-translate the section into a target locale. Translates the title and
 * content the host is CURRENTLY editing (passed live from the client, so
 * unsaved edits are translated too), persists the machine translations, and
 * returns them so the editor can show them immediately.
 */
export async function translateSectionAction(input: {
  sectionId: string;
  locale: Locale;
  title: string;
  content: string;
}): Promise<{ ok: boolean; title: string; content: string; error?: string }> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const section = await loadOwnedSection(input.sectionId, ctx.organization.id);
  if (!section) return { ok: false, title: "", content: "", error: "Section not found." };

  const [title, content] = await Promise.all([
    translateContent({ text: input.title, to: input.locale }),
    translateContent({ text: input.content, to: input.locale }),
  ]);

  for (const [field, value] of [["title", title], ["content", content]] as const) {
    await db.translation.upsert({
      where: {
        entityType_entityId_field_locale: {
          entityType: "GuideSection",
          entityId: input.sectionId,
          field,
          locale: input.locale,
        },
      },
      create: {
        entityType: "GuideSection",
        entityId: input.sectionId,
        field,
        locale: input.locale,
        value,
        isMachine: true,
      },
      update: { value, isMachine: true },
    });
  }
  revalidatePath(`/properties/${section.property.id}/guide/${input.sectionId}`);
  return { ok: true, title, content };
}
