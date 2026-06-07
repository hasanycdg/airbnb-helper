"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Locale } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { SECTION_TYPE_MAP } from "@/lib/constants";
import { translateContent } from "@/lib/ai";
import { getTemplate } from "@/components/templates/template-data";

export type TemplateActionState =
  | { error?: string; success?: boolean; sectionId?: string; locales?: Locale[] }
  | undefined;

const applySchema = z.object({
  propertyId: z.string().min(1, "Please select a property."),
  templateKey: z.string().min(1, "Missing template key."),
  baseLocale: z.enum(["DE", "EN"]).default("DE"),
});

/**
 * Apply a Tirol/DACH content template to a property.
 *
 * Behaviour:
 * 1. Verifies the caller has the guide:edit permission (OWNER or MANAGER).
 * 2. Verifies the property belongs to the caller's organisation.
 * 3. Looks up the template by key.
 * 4. Upserts a GuideSection of the matching SectionType:
 *    - If a section of that type already exists, updates its title & content.
 *    - If not, creates a new section.
 * 5. Upserts a Translation row for the secondary language.
 * 6. Audits the action.
 * 7. Revalidates the guide path.
 */
export async function applyTemplateToProperty(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = applySchema.safeParse({
    propertyId: formData.get("propertyId"),
    templateKey: formData.get("templateKey"),
    baseLocale: formData.get("baseLocale") ?? "DE",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { propertyId, templateKey, baseLocale } = parsed.data;

  // Org-scoped property lookup — never trust a bare client id.
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true, baseLocale: true, supportedLocales: true },
  });
  if (!property) {
    return { error: "Property not found." };
  }

  const template = getTemplate(templateKey);
  if (!template) {
    return { error: "Template not found." };
  }

  // The chosen primary language becomes the GuideSection body; every other
  // language the property supports is stored as a Translation row.
  const primaryLocale: Locale = baseLocale as Locale;
  const primaryContent =
    primaryLocale === "DE" ? template.contentDE : template.contentEN;
  const primaryTitle =
    primaryLocale === "DE" ? template.titleDE : template.titleEN;

  const sectionType = template.sectionType;
  const meta = SECTION_TYPE_MAP[sectionType];

  // Try to find an existing section of this type on the property.
  const existingSection = await db.guideSection.findFirst({
    where: { propertyId, type: sectionType },
    select: { id: true, slug: true },
  });

  let sectionId: string;

  if (existingSection) {
    // Update existing section.
    await db.guideSection.update({
      where: { id: existingSection.id },
      data: {
        title: primaryTitle,
        content: primaryContent,
        icon: meta?.lucide ?? template.icon,
        isVisible: true,
      },
    });
    sectionId = existingSection.id;
  } else {
    // Create a new section. Ensure unique slug within property.
    let slug = slugify(primaryTitle) || meta?.slug || "section";
    while (await db.guideSection.findFirst({ where: { propertyId, slug } })) {
      slug = `${slug}-${nanoid(3).toLowerCase()}`;
    }

    const count = await db.guideSection.count({ where: { propertyId } });

    const created = await db.guideSection.create({
      data: {
        propertyId,
        type: sectionType,
        slug,
        title: primaryTitle,
        content: primaryContent,
        icon: meta?.lucide ?? template.icon,
        order: count,
        isVisible: true,
      },
    });
    sectionId = created.id;
  }

  // Populate every OTHER language the property supports. DE/EN use the
  // template's built-in human text; all others are AI-translated from the
  // primary content (translateContent falls back to the source text offline).
  const targetLocales = property.supportedLocales.filter((l) => l !== primaryLocale);

  const localized = async (
    field: "title" | "content",
    to: Locale,
  ): Promise<{ value: string; isMachine: boolean }> => {
    if (to === "DE")
      return { value: field === "title" ? template.titleDE : template.contentDE, isMachine: false };
    if (to === "EN")
      return { value: field === "title" ? template.titleEN : template.contentEN, isMachine: false };
    const source = field === "title" ? primaryTitle : primaryContent;
    return { value: await translateContent({ text: source, to }), isMachine: true };
  };

  await Promise.all(
    targetLocales.map(async (locale) => {
      const [title, content] = await Promise.all([
        localized("title", locale),
        localized("content", locale),
      ]);
      for (const [field, res] of [
        ["title", title] as const,
        ["content", content] as const,
      ]) {
        await db.translation.upsert({
          where: {
            entityType_entityId_field_locale: {
              entityType: "GuideSection",
              entityId: sectionId,
              field,
              locale,
            },
          },
          create: {
            entityType: "GuideSection",
            entityId: sectionId,
            field,
            locale,
            value: res.value,
            isMachine: res.isMachine,
          },
          update: { value: res.value, isMachine: res.isMachine },
        });
      }
    }),
  );

  const filledLocales: Locale[] = [primaryLocale, ...targetLocales];

  await audit({
    action: "template.apply",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideSection",
    targetId: sectionId,
    metadata: {
      templateKey,
      propertyId,
      baseLocale: primaryLocale,
      locales: filledLocales,
    },
  });

  revalidatePath(`/properties/${propertyId}/guide`);
  revalidatePath(`/properties/${propertyId}/guide/${sectionId}`);

  return { success: true, sectionId, locales: filledLocales };
}
