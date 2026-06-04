"use server";

/**
 * Server actions for MessageTemplate management.
 *
 * NOTE: In v1 templates are copy/preview only — no real sending occurs here.
 * Scheduled sending activates automatically once guest contact details are
 * stored on a GuestStay (guestEmail / guestPhone) and a ScheduledMessage is
 * created pointing at a template. The ScheduledMessage worker then picks those
 * up and delivers them via the configured channel.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Locale, MessageChannel, MessageType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type TemplateActionState = { error?: string; success?: boolean } | undefined;

// ── Validation ────────────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  type: z.string().min(1, "Type is required"),
  locale: z.string().min(2, "Locale is required"),
  channel: z.string().min(1, "Channel is required"),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, "Body is required"),
  propertyId: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────

/** Load a template that belongs to the current org, or null. */
async function loadOwnedTemplate(templateId: string, orgId: string) {
  return db.messageTemplate.findFirst({
    where: { id: templateId, organizationId: orgId },
  });
}

// ── Actions ───────────────────────────────────────────────────────────────

export async function createTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    locale: formData.get("locale"),
    channel: formData.get("channel"),
    subject: formData.get("subject") ?? undefined,
    body: formData.get("body"),
    propertyId: formData.get("propertyId") ?? undefined,
  };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  // If a propertyId is supplied, verify it belongs to this org.
  if (d.propertyId) {
    const prop = await db.property.findFirst({
      where: { id: d.propertyId, organizationId: orgId },
      select: { id: true },
    });
    if (!prop) return { error: "Property not found." };
  }

  const template = await db.messageTemplate.create({
    data: {
      organizationId: orgId,
      propertyId: d.propertyId || null,
      name: d.name.trim(),
      type: d.type as MessageType,
      locale: d.locale as Locale,
      channel: d.channel as MessageChannel,
      subject: d.subject?.trim() || null,
      body: d.body,
      enabled: true,
    },
  });

  await audit({
    action: "message_template.create",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "MessageTemplate",
    targetId: template.id,
  });

  revalidatePath("/messages");
  return { success: true };
}

export async function updateTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const templateId = String(formData.get("templateId") ?? "");
  const existing = await loadOwnedTemplate(templateId, orgId);
  if (!existing) return { error: "Template not found." };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    locale: formData.get("locale"),
    channel: formData.get("channel"),
    subject: formData.get("subject") ?? undefined,
    body: formData.get("body"),
    propertyId: formData.get("propertyId") ?? undefined,
  };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  if (d.propertyId) {
    const prop = await db.property.findFirst({
      where: { id: d.propertyId, organizationId: orgId },
      select: { id: true },
    });
    if (!prop) return { error: "Property not found." };
  }

  await db.messageTemplate.update({
    where: { id: templateId },
    data: {
      name: d.name.trim(),
      type: d.type as MessageType,
      locale: d.locale as Locale,
      channel: d.channel as MessageChannel,
      subject: d.subject?.trim() || null,
      body: d.body,
      propertyId: d.propertyId || null,
    },
  });

  await audit({
    action: "message_template.update",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "MessageTemplate",
    targetId: templateId,
  });

  revalidatePath("/messages");
  return { success: true };
}

export async function toggleTemplateEnabledAction(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const templateId = String(formData.get("templateId") ?? "");
  const existing = await loadOwnedTemplate(templateId, orgId);
  if (!existing) return;

  await db.messageTemplate.update({
    where: { id: templateId },
    data: { enabled: !existing.enabled },
  });

  await audit({
    action: existing.enabled ? "message_template.disable" : "message_template.enable",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "MessageTemplate",
    targetId: templateId,
  });

  revalidatePath("/messages");
}

export async function duplicateTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const templateId = String(formData.get("templateId") ?? "");
  const existing = await loadOwnedTemplate(templateId, orgId);
  if (!existing) return { error: "Template not found." };

  const copy = await db.messageTemplate.create({
    data: {
      organizationId: orgId,
      propertyId: existing.propertyId,
      name: `${existing.name} (copy)`,
      type: existing.type,
      locale: existing.locale,
      channel: existing.channel,
      subject: existing.subject,
      body: existing.body,
      enabled: false, // duplicates start disabled
    },
  });

  await audit({
    action: "message_template.duplicate",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "MessageTemplate",
    targetId: copy.id,
    metadata: { sourceId: templateId },
  });

  revalidatePath("/messages");
  return { success: true };
}

export async function deleteTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const templateId = String(formData.get("templateId") ?? "");
  const existing = await loadOwnedTemplate(templateId, orgId);
  if (!existing) return { error: "Template not found." };

  await db.messageTemplate.delete({ where: { id: templateId } });

  await audit({
    action: "message_template.delete",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "MessageTemplate",
    targetId: templateId,
  });

  revalidatePath("/messages");
  return { success: true };
}
