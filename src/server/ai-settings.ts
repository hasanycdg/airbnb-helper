"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";

export type AiSettingsState = { error?: string; success?: boolean } | undefined;

const aiSettingsSchema = z.object({
  aiEnabled: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()),
  aiConfidenceThreshold: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(1, "Must be at most 1"),
  aiSystemPromptExtra: z.string().max(2000, "Max 2 000 characters").optional(),
});

export async function updateAiSettings(
  _prev: AiSettingsState,
  formData: FormData,
): Promise<AiSettingsState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const propertyId = String(formData.get("propertyId") ?? "");

  // Org-scope guard — never trust a raw client id.
  const property = await db.property.findFirst({
    where: { id: propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { error: "Property not found." };

  const parsed = aiSettingsSchema.safeParse({
    aiEnabled: formData.get("aiEnabled"),
    aiConfidenceThreshold: formData.get("aiConfidenceThreshold"),
    aiSystemPromptExtra: formData.get("aiSystemPromptExtra"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { aiEnabled, aiConfidenceThreshold, aiSystemPromptExtra } = parsed.data;

  await db.property.update({
    where: { id: propertyId },
    data: {
      aiEnabled,
      aiConfidenceThreshold,
      aiSystemPromptExtra: aiSystemPromptExtra?.trim() || null,
    },
  });

  await audit({
    action: "ai:configure",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Property",
    targetId: propertyId,
    metadata: { aiEnabled, aiConfidenceThreshold },
  });

  await trackEvent({
    organizationId: ctx.organization.id,
    propertyId,
    type: "AI_QUESTION", // closest available event type to represent a config change
    metadata: { action: "configure", aiEnabled, aiConfidenceThreshold },
  });

  revalidatePath(`/properties/${propertyId}/ai`);
  return { success: true };
}
