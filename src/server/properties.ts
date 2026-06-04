"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrg, requireRole } from "@/lib/auth";
import { canCreateProperty } from "@/lib/usage";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { LOCALES, SECTION_TYPE_MAP } from "@/lib/constants";
import { nanoid } from "nanoid";

export type PropertyActionState = { error?: string; success?: boolean } | undefined;

/** Sections pre-created for a new property so hosts start from a template. */
const STARTER_SECTIONS: { type: keyof typeof SECTION_TYPE_MAP }[] = [
  { type: "WELCOME" },
  { type: "CHECK_IN" },
  { type: "KEYBOX" },
  { type: "PARKING" },
  { type: "WIFI" },
  { type: "HEATING" },
  { type: "TRASH" },
  { type: "HOUSE_RULES" },
  { type: "CHECKOUT" },
  { type: "LOCAL_RECOMMENDATIONS" },
];

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "property";
  let slug = root;
  for (let i = 0; i < 50; i++) {
    const exists = await db.property.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${root}-${nanoid(4).toLowerCase()}`;
  }
  return `${root}-${nanoid(8).toLowerCase()}`;
}

const createSchema = z.object({
  publicName: z.string().min(2, "Property name is required"),
  internalName: z.string().optional(),
  city: z.string().optional(),
});

export async function createPropertyAction(
  _prev: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const plan = ctx.organization.subscription?.plan ?? "TRIAL";

  const limit = await canCreateProperty(ctx.organization.id, plan);
  if (!limit.allowed) return { error: limit.reason };

  const parsed = createSchema.safeParse({
    publicName: formData.get("publicName"),
    internalName: formData.get("internalName"),
    city: formData.get("city"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug = await uniqueSlug(parsed.data.publicName);

  const property = await db.property.create({
    data: {
      organizationId: ctx.organization.id,
      slug,
      name: parsed.data.internalName?.trim() || parsed.data.publicName.trim(),
      publicName: parsed.data.publicName.trim(),
      internalName: parsed.data.internalName?.trim() || null,
      city: parsed.data.city?.trim() || null,
      country: "Austria",
      baseLocale: ctx.organization.defaultLocale,
      supportedLocales: ctx.organization.supportedLocales,
      hostName: ctx.user.name,
      hostEmail: ctx.user.email,
      sections: {
        create: STARTER_SECTIONS.map((s, i) => {
          const meta = SECTION_TYPE_MAP[s.type];
          return {
            type: s.type,
            slug: meta.slug,
            title: meta.label,
            shortDescription: "",
            content: "",
            icon: meta.lucide,
            order: i,
            isVisible: true,
          };
        }),
      },
    },
  });

  await audit({
    action: "property.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Property",
    targetId: property.id,
  });

  redirect(`/properties/${property.id}/guide`);
}

const updateSchema = z.object({
  publicName: z.string().min(2),
  internalName: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  maxGuests: z.coerce.number().int().min(0).optional(),
  hostName: z.string().optional(),
  hostEmail: z.string().optional(),
  hostPhone: z.string().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  parkingInfo: z.string().optional(),
  houseRules: z.string().optional(),
  quietHoursFrom: z.string().optional(),
  quietHoursTo: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

export async function updatePropertyAction(
  _prev: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId"));

  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true, baseLocale: true },
  });
  if (!property) return { error: "Property not found." };

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const selected = formData.getAll("supportedLocales").map(String) as Locale[];
  const supportedLocales = LOCALES.filter((l) => selected.includes(l));
  if (!supportedLocales.includes(property.baseLocale)) supportedLocales.unshift(property.baseLocale);

  const d = parsed.data;
  await db.property.update({
    where: { id: propertyId },
    data: {
      publicName: d.publicName.trim(),
      name: d.internalName?.trim() || d.publicName.trim(),
      internalName: d.internalName?.trim() || null,
      addressLine: d.addressLine || null,
      city: d.city || null,
      country: d.country || null,
      postalCode: d.postalCode || null,
      timezone: d.timezone || "Europe/Vienna",
      checkInTime: d.checkInTime || "15:00",
      checkOutTime: d.checkOutTime || "10:00",
      maxGuests: d.maxGuests ?? null,
      hostName: d.hostName || null,
      hostEmail: d.hostEmail || null,
      hostPhone: d.hostPhone || null,
      wifiName: d.wifiName || null,
      wifiPassword: d.wifiPassword || null,
      parkingInfo: d.parkingInfo || null,
      houseRules: d.houseRules || null,
      quietHoursFrom: d.quietHoursFrom || null,
      quietHoursTo: d.quietHoursTo || null,
      coverImageUrl: d.coverImageUrl || null,
      supportedLocales: supportedLocales.length ? supportedLocales : [property.baseLocale],
    },
  });

  await audit({
    action: "property.update",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Property",
    targetId: propertyId,
  });
  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId"));
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { isPublished: true },
  });
  if (!property) return;
  await db.property.update({
    where: { id: propertyId },
    data: { isPublished: !property.isPublished },
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId"));
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) redirect("/properties");
  await db.property.delete({ where: { id: propertyId } });
  await audit({
    action: "property.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Property",
    targetId: propertyId,
  });
  redirect("/properties");
}

/** Load a property scoped to the active organization, or null. */
export async function getOrgProperty(propertyId: string) {
  const ctx = await requireOrg();
  return db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
  });
}
