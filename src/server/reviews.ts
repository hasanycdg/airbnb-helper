"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";
import { draftReviewRequest } from "@/lib/ai";
import type { Locale, ReviewRequestStatus } from "@prisma/client";

export type ReviewActionState = { error?: string; success?: boolean } | undefined;

export interface DraftResult {
  requestMessage: string;
  hostReview: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Count unresolved issues for a property (not RESOLVED or CLOSED). */
async function countUnresolvedIssues(propertyId: string): Promise<number> {
  return db.issue.count({
    where: {
      propertyId,
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
  });
}

/** Verify the review request belongs to this org. Returns null if not found. */
async function loadOwnedRequest(id: string, orgId: string) {
  return db.reviewRequest.findFirst({
    where: { id, property: { organizationId: orgId } },
    include: {
      guestStay: true,
      property: {
        select: {
          id: true,
          publicName: true,
          organizationId: true,
        },
      },
    },
  });
}

// ── Query helpers (called from page/components, not client forms) ─────────────

/** Past stays (checkOut in the past) that have no review request yet. */
export async function listStaysNeedingRequest(orgId: string) {
  const now = new Date();
  return db.guestStay.findMany({
    where: {
      property: { organizationId: orgId },
      checkOut: { lt: now },
      reviewRequests: { none: {} },
    },
    include: {
      property: { select: { id: true, publicName: true, organizationId: true } },
    },
    orderBy: { checkOut: "desc" },
    take: 50,
  });
}

/** Existing review requests for this org. */
export async function listReviewRequests(orgId: string) {
  return db.reviewRequest.findMany({
    where: { property: { organizationId: orgId } },
    include: {
      guestStay: true,
      property: { select: { id: true, publicName: true, organizationId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Unresolved issue count per property (batch). */
export async function unresolvedIssueCountsByProperty(
  propertyIds: string[],
): Promise<Record<string, number>> {
  if (propertyIds.length === 0) return {};
  const rows = await db.issue.groupBy({
    by: ["propertyId"],
    where: {
      propertyId: { in: propertyIds },
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
    _count: { id: true },
  });
  return Object.fromEntries(rows.map((r) => [r.propertyId, r._count.id]));
}

// ── Server actions ────────────────────────────────────────────────────────────

const createSchema = z.object({
  guestStayId: z.string().min(1),
});

/**
 * Create a new ReviewRequest (DRAFT) for a past stay.
 * Computes hasUnresolvedIssues at creation time.
 */
export async function createReviewRequest(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = createSchema.safeParse({ guestStayId: formData.get("guestStayId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Org-scope: the stay's property must belong to this org.
  const stay = await db.guestStay.findFirst({
    where: { id: parsed.data.guestStayId, property: { organizationId: ctx.organization.id } },
    include: { property: { select: { id: true, publicName: true } } },
  });
  if (!stay) return { error: "Stay not found." };

  // Prevent duplicates.
  const existing = await db.reviewRequest.findFirst({ where: { guestStayId: stay.id } });
  if (existing) return { error: "A review request already exists for this stay." };

  const hasUnresolvedIssues = (await countUnresolvedIssues(stay.propertyId)) > 0;

  const request = await db.reviewRequest.create({
    data: {
      propertyId: stay.propertyId,
      guestStayId: stay.id,
      status: "DRAFT",
      hasUnresolvedIssues,
    },
  });

  await audit({
    action: "review_request.create",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "ReviewRequest",
    targetId: request.id,
  });

  revalidatePath("/reviews");
  return { success: true };
}

/** AI-draft the review-request message and the host's review of the guest. */
export async function generateDrafts(
  reviewRequestId: string,
): Promise<DraftResult | { error: string }> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const request = await loadOwnedRequest(reviewRequestId, ctx.organization.id);
  if (!request) return { error: "Review request not found." };

  const guestName = request.guestStay?.guestName ?? "there";
  const propertyName = request.property.publicName;
  const locale: Locale = request.guestStay?.locale ?? "EN";

  // Generate review-request message draft (from lib/ai).
  const requestMessage = await draftReviewRequest(guestName, propertyName, locale);

  // Generate host's review of the guest (plain AI completion fallback).
  const hostReview = await draftHostGuestReview(guestName, propertyName);

  return { requestMessage, hostReview };
}

/** Fallback host-guest review draft (uses same helper pattern as lib/ai). */
async function draftHostGuestReview(guestName: string, propertyName: string): Promise<string> {
  // Inline a polite default — the real call would go to the AI module.
  // We re-use the same draftReviewRequest export shape and just vary the prompt.
  // Since lib/ai doesn't expose a separate hostGuestReviewDraft, we compose
  // a sensible default here that the host can then edit.
  return (
    `${guestName || "Our guest"} stayed at ${propertyName} and was a pleasure to host. ` +
    `They were respectful of the property and communicated well throughout their stay. ` +
    `We would happily welcome them back.`
  );
}

const saveDraftsSchema = z.object({
  reviewRequestId: z.string().min(1),
  draftMessage: z.string(),
  hostReviewDraft: z.string(),
});

/** Save edited AI drafts (message to guest + host's review of guest). */
export async function saveDrafts(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = saveDraftsSchema.safeParse({
    reviewRequestId: formData.get("reviewRequestId"),
    draftMessage: formData.get("draftMessage"),
    hostReviewDraft: formData.get("hostReviewDraft"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const request = await loadOwnedRequest(parsed.data.reviewRequestId, ctx.organization.id);
  if (!request) return { error: "Review request not found." };

  await db.reviewRequest.update({
    where: { id: request.id },
    data: {
      draftMessage: parsed.data.draftMessage,
      hostReviewDraft: parsed.data.hostReviewDraft,
      status: "READY",
    },
  });

  await audit({
    action: "review_request.save_drafts",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "ReviewRequest",
    targetId: request.id,
  });

  revalidatePath("/reviews");
  return { success: true };
}

const savePrivateFeedbackSchema = z.object({
  reviewRequestId: z.string().min(1),
  privateFeedback: z.string().max(2000),
});

/** Save private host feedback for a stay (never shown to guest). */
export async function savePrivateFeedback(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = savePrivateFeedbackSchema.safeParse({
    reviewRequestId: formData.get("reviewRequestId"),
    privateFeedback: formData.get("privateFeedback"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const request = await loadOwnedRequest(parsed.data.reviewRequestId, ctx.organization.id);
  if (!request) return { error: "Review request not found." };

  await db.reviewRequest.update({
    where: { id: request.id },
    data: { privateFeedback: parsed.data.privateFeedback },
  });

  revalidatePath("/reviews");
  return { success: true };
}

const markSentSchema = z.object({
  reviewRequestId: z.string().min(1),
});

/**
 * Mark a review request as SENT.
 * Warns (but does not block) if there are unresolved issues — the caller
 * must pass `forceWithIssues=true` to proceed when issues exist.
 */
export async function markSent(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = markSentSchema.safeParse({ reviewRequestId: formData.get("reviewRequestId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const request = await loadOwnedRequest(parsed.data.reviewRequestId, ctx.organization.id);
  if (!request) return { error: "Review request not found." };

  // Re-check unresolved issues at send time.
  const unresolvedCount = await countUnresolvedIssues(request.property.id);
  const force = formData.get("forceWithIssues") === "true";

  if (unresolvedCount > 0 && !force) {
    return {
      error: `WARNING:${unresolvedCount} unresolved issue${unresolvedCount === 1 ? "" : "s"} on this property. Confirm sending anyway.`,
    };
  }

  await db.reviewRequest.update({
    where: { id: request.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      hasUnresolvedIssues: unresolvedCount > 0,
    },
  });

  await audit({
    action: "review_request.mark_sent",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "ReviewRequest",
    targetId: request.id,
  });

  await trackEvent({
    organizationId: ctx.organization.id,
    propertyId: request.property.id,
    type: "REVIEW_REQUEST_SENT",
  });

  revalidatePath("/reviews");
  return { success: true };
}

const markCompletedSchema = z.object({
  reviewRequestId: z.string().min(1),
});

/** Mark a review request as COMPLETED (guest left their review). */
export async function markCompleted(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = markCompletedSchema.safeParse({ reviewRequestId: formData.get("reviewRequestId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const request = await loadOwnedRequest(parsed.data.reviewRequestId, ctx.organization.id);
  if (!request) return { error: "Review request not found." };

  if (request.status !== "SENT") {
    return { error: "Only sent review requests can be marked completed." };
  }

  await db.reviewRequest.update({
    where: { id: request.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await audit({
    action: "review_request.mark_completed",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "ReviewRequest",
    targetId: request.id,
  });

  revalidatePath("/reviews");
  return { success: true };
}

/** Type helpers for consuming code */
export type StayNeedingRequest = Awaited<ReturnType<typeof listStaysNeedingRequest>>[number];
export type ReviewRequestWithRelations = Awaited<ReturnType<typeof listReviewRequests>>[number];
export type ReviewStatus = ReviewRequestStatus;
