"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";
import { suggestFaqs } from "@/lib/ai";
import { slugify } from "@/lib/utils";
import { SECTION_TYPE_MAP } from "@/lib/constants";

export type State = { error?: string; success?: boolean } | undefined;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve a question scoped to the org (via its property). */
async function loadOrgQuestion(questionId: string, orgId: string) {
  return db.guestQuestion.findFirst({
    where: { id: questionId, property: { organizationId: orgId } },
    include: { property: { select: { id: true, name: true, organizationId: true } } },
  });
}

// ── markAnswered ────────────────────────────────────────────────────────────

const markAnsweredSchema = z.object({
  questionId: z.string().min(1),
  answerText: z.string().optional(),
});

export async function markAnsweredAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = markAnsweredSchema.safeParse({
    questionId: formData.get("questionId"),
    answerText: formData.get("answerText") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const question = await loadOrgQuestion(parsed.data.questionId, ctx.organization.id);
  if (!question) return { error: "Question not found." };

  await db.guestQuestion.update({
    where: { id: parsed.data.questionId },
    data: {
      answered: true,
      answerText: parsed.data.answerText?.trim() || null,
    },
  });

  await audit({
    action: "question.mark_answered",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuestQuestion",
    targetId: parsed.data.questionId,
  });

  revalidatePath("/questions");
  return { success: true };
}

// ── markEscalated ───────────────────────────────────────────────────────────

export async function markEscalatedAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return { error: "Question ID required." };

  const question = await loadOrgQuestion(questionId, ctx.organization.id);
  if (!question) return { error: "Question not found." };

  await db.guestQuestion.update({
    where: { id: questionId },
    data: { escalated: true },
  });

  await audit({
    action: "question.escalate",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuestQuestion",
    targetId: questionId,
  });

  revalidatePath("/questions");
  return { success: true };
}

// ── createFaqFromQuestion ───────────────────────────────────────────────────

const createFaqSchema = z.object({
  questionId: z.string().min(1),
  propertyId: z.string().min(1),
  title: z.string().min(2, "FAQ title must be at least 2 characters"),
  content: z.string().optional(),
});

export async function createFaqFromQuestionAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = createFaqSchema.safeParse({
    questionId: formData.get("questionId"),
    propertyId: formData.get("propertyId"),
    title: formData.get("title"),
    content: formData.get("content") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // "_suggestion_" is the sentinel used by the suggestions panel (no linked question row).
  const isSuggestion = parsed.data.questionId === "_suggestion_";

  // Verify the question belongs to the org (skip for AI-suggestion flow)
  const question = isSuggestion
    ? null
    : await loadOrgQuestion(parsed.data.questionId, ctx.organization.id);
  if (!isSuggestion && !question) return { error: "Question not found." };

  // Verify the property belongs to the org
  const property = await db.property.findFirst({
    where: { id: parsed.data.propertyId, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) return { error: "Property not found." };

  const meta = SECTION_TYPE_MAP["FAQ"];
  let slug = slugify(parsed.data.title) || "faq";
  // Make slug unique within the property
  while (await db.guideSection.findFirst({ where: { propertyId: parsed.data.propertyId, slug } })) {
    slug = `${slug}-${nanoid(3).toLowerCase()}`;
  }

  const count = await db.guideSection.count({ where: { propertyId: parsed.data.propertyId } });

  const section = await db.guideSection.create({
    data: {
      propertyId: parsed.data.propertyId,
      type: "FAQ",
      slug,
      title: parsed.data.title.trim(),
      icon: meta.lucide,
      order: count,
      isVisible: true,
      content: parsed.data.content?.trim() ?? "",
    },
  });

  // Mark the source question as resolved (skip for suggestion-only flow)
  if (!isSuggestion) {
    await db.guestQuestion.update({
      where: { id: parsed.data.questionId },
      data: {
        suggestedFaq: true,
        answered: true,
      },
    });
  }

  await audit({
    action: "question.create_faq",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "GuideSection",
    targetId: section.id,
    metadata: { fromQuestionId: parsed.data.questionId },
  });

  await trackEvent({
    organizationId: ctx.organization.id,
    propertyId: parsed.data.propertyId,
    type: "AI_QUESTION",
    metadata: { action: "faq_created_from_question", questionId: parsed.data.questionId },
  });

  revalidatePath("/questions");
  revalidatePath(`/properties/${parsed.data.propertyId}/guide`);
  return { success: true };
}

// ── generateFaqSuggestions ──────────────────────────────────────────────────

/**
 * Returns up to 5 suggested FAQ topics derived from the org's recent
 * unanswered questions. Org-scoped, read-only — no mutation.
 */
export async function generateFaqSuggestions(organizationId: string): Promise<string[]> {
  const recent = await db.guestQuestion.findMany({
    where: {
      property: { organizationId },
      answered: false,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { question: true },
  });

  if (recent.length === 0) return [];

  const texts = recent.map((q) => q.question);
  return suggestFaqs(texts);
}
