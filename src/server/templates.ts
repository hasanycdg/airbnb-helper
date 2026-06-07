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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { propertyId, templateKey } = parsed.data;

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

  // The section body MUST be written in the property's REAL base language.
  // translateField() returns the section body verbatim for base-locale viewers,
  // so a mismatch (e.g. a German body on an English-base property) would make
  // the guide "always show German". DE/EN come from the template; any other
  // base language is AI-translated from the canonical German source.
  const base: Locale = property.baseLocale;

  // Resolve a field for a locale: built-in template text for DE/EN, AI
  // translation (from the German source) for everything else. translateContent
  // falls back to the source text when AI is offline.
  const localized = async (
    field: "title" | "content",
    to: Locale,
  ): Promise<{ value: string; isMachine: boolean }> => {
    if (to === "DE")
      return { value: field === "title" ? template.titleDE : template.contentDE, isMachine: false };
    if (to === "EN")
      return { value: field === "title" ? template.titleEN : template.contentEN, isMachine: false };
    const source = field === "title" ? template.titleDE : template.contentDE;
    return { value: await translateContent({ text: source, to }), isMachine: true };
  };

  const baseTitle = (await localized("title", base)).value;
  const baseContent = (await localized("content", base)).value;

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
        title: baseTitle,
        content: baseContent,
        icon: meta?.lucide ?? template.icon,
        isVisible: true,
      },
    });
    sectionId = existingSection.id;
  } else {
    // Create a new section. Ensure unique slug within property.
    let slug = slugify(baseTitle) || meta?.slug || "section";
    while (await db.guideSection.findFirst({ where: { propertyId, slug } })) {
      slug = `${slug}-${nanoid(3).toLowerCase()}`;
    }

    const count = await db.guideSection.count({ where: { propertyId } });

    const created = await db.guideSection.create({
      data: {
        propertyId,
        type: sectionType,
        slug,
        title: baseTitle,
        content: baseContent,
        icon: meta?.lucide ?? template.icon,
        order: count,
        isVisible: true,
      },
    });
    sectionId = created.id;
  }

  // Populate every OTHER language the property supports as a Translation row.
  const targetLocales = property.supportedLocales.filter((l) => l !== base);

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

  const filledLocales: Locale[] = [base, ...targetLocales];

  await audit({
    action: "template.apply",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideSection",
    targetId: sectionId,
    metadata: {
      templateKey,
      propertyId,
      baseLocale: base,
      locales: filledLocales,
    },
  });

  revalidatePath(`/properties/${propertyId}/guide`);
  revalidatePath(`/properties/${propertyId}/guide/${sectionId}`);

  return { success: true, sectionId, locales: filledLocales };
}
