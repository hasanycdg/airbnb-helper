"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { LOCALES } from "@/lib/constants";

export type OrgActionState = { error?: string; success?: boolean } | undefined;

// ── Update organization ────────────────────────────────────────────────────

const updateSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour (e.g. #0F766E)")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  defaultLocale: z.enum(["DE", "EN", "IT", "FR", "NL", "ES", "TR"] as const),
});

export async function updateOrganizationAction(
  _prev: OrgActionState,
  formData: FormData,
): Promise<OrgActionState> {
  const ctx = await requireRole(["OWNER"]);

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    primaryColor: formData.get("primaryColor"),
    logoUrl: formData.get("logoUrl"),
    defaultLocale: formData.get("defaultLocale"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Supported locales — always include the default locale
  const selected = formData.getAll("supportedLocales").map(String) as Locale[];
  const supportedLocales = LOCALES.filter((l) => selected.includes(l));
  if (!supportedLocales.includes(parsed.data.defaultLocale as Locale)) {
    supportedLocales.unshift(parsed.data.defaultLocale as Locale);
  }

  const { name, primaryColor, logoUrl, defaultLocale } = parsed.data;

  await db.organization.update({
    where: { id: ctx.organization.id },
    data: {
      name: name.trim(),
      primaryColor: primaryColor || ctx.organization.primaryColor,
      logoUrl: logoUrl || null,
      defaultLocale: defaultLocale as Locale,
      supportedLocales: supportedLocales.length ? supportedLocales : [defaultLocale as Locale],
    },
  });

  await audit({
    action: "organization.update",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Organization",
    targetId: ctx.organization.id,
  });

  revalidatePath("/settings/organization");
  return { success: true };
}

// ── Delete organization ────────────────────────────────────────────────────

export async function deleteOrganizationAction(
  _prev: OrgActionState,
  formData: FormData,
): Promise<OrgActionState> {
  const ctx = await requireRole(["OWNER"]);

  // Safety check: confirm phrase must match
  const confirm = String(formData.get("confirm") ?? "").trim();
  const expected = ctx.organization.name.trim();
  if (confirm !== expected) {
    return { error: `Please type the organization name exactly: "${expected}"` };
  }

  await audit({
    action: "organization.delete",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Organization",
    targetId: ctx.organization.id,
    metadata: { name: ctx.organization.name },
  });

  // Cascade deletes all org data (properties, members, etc.) via Prisma schema
  await db.organization.delete({ where: { id: ctx.organization.id } });

  redirect("/onboarding");
}
