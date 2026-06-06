"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { IssueStatus, IssueUrgency } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { draftGuestReply, summarizeIssue } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export type IssueActionState = { error?: string; success?: boolean; info?: string } | undefined;

/** On-demand AI summary of an issue (org-scoped). Not run during page render. */
export async function summarizeIssueAction(issueId: string): Promise<string> {
  const ctx = await requireOrg();
  const issue = await db.issue.findFirst({
    where: { id: issueId, organizationId: ctx.organization.id },
    select: { title: true, description: true },
  });
  if (!issue) return "";
  const text = [issue.title, issue.description].filter(Boolean).join("\n");
  if (!text.trim()) return "";
  return summarizeIssue(text);
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function loadOwnedIssue(issueId: string, orgId: string) {
  return db.issue.findFirst({
    where: { id: issueId, organizationId: orgId },
  });
}

// ── Status workflow ────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  issueId: z.string().min(1),
  status: z.enum(["NEW", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export async function updateIssueStatus(
  _prev: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const ctx = await requireOrg();
  if (!can(ctx.role, "issues:manage")) return { error: "Not authorised." };

  const parsed = updateStatusSchema.safeParse({
    issueId: formData.get("issueId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const issue = await loadOwnedIssue(parsed.data.issueId, ctx.organization.id);
  if (!issue) return { error: "Issue not found." };

  const resolvedAt =
    parsed.data.status === "RESOLVED" && issue.status !== "RESOLVED"
      ? new Date()
      : parsed.data.status !== "RESOLVED"
        ? null
        : issue.resolvedAt;

  await db.issue.update({
    where: { id: parsed.data.issueId },
    data: {
      status: parsed.data.status as IssueStatus,
      ...(resolvedAt !== undefined ? { resolvedAt } : {}),
    },
  });

  await audit({
    action: "issue.status_change",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Issue",
    targetId: parsed.data.issueId,
    metadata: { from: issue.status, to: parsed.data.status },
  });

  revalidatePath(`/issues/${parsed.data.issueId}`);
  revalidatePath("/issues");
  return { success: true };
}

// ── Assign ─────────────────────────────────────────────────────────────────

const assignSchema = z.object({
  issueId: z.string().min(1),
  assignedToId: z.string(), // empty string means unassign
});

export async function assignIssue(
  _prev: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const ctx = await requireOrg();
  if (!can(ctx.role, "issues:manage")) return { error: "Not authorised." };

  const parsed = assignSchema.safeParse({
    issueId: formData.get("issueId"),
    assignedToId: formData.get("assignedToId") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const issue = await loadOwnedIssue(parsed.data.issueId, ctx.organization.id);
  if (!issue) return { error: "Issue not found." };

  // Verify assignee is a member of this org
  const assignedToId =
    parsed.data.assignedToId && parsed.data.assignedToId !== "unassigned"
      ? parsed.data.assignedToId
      : null;
  if (assignedToId) {
    const member = await db.organizationMember.findFirst({
      where: { organizationId: ctx.organization.id, userId: assignedToId },
    });
    if (!member) return { error: "Assignee is not a member of this organisation." };
  }

  await db.issue.update({
    where: { id: parsed.data.issueId },
    data: {
      assignedToId,
      status:
        assignedToId && issue.status === "NEW"
          ? ("ASSIGNED" as IssueStatus)
          : issue.status,
    },
  });

  await audit({
    action: "issue.assign",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Issue",
    targetId: parsed.data.issueId,
    metadata: { assignedToId },
  });

  revalidatePath(`/issues/${parsed.data.issueId}`);
  revalidatePath("/issues");
  return { success: true };
}

// ── Urgency ────────────────────────────────────────────────────────────────

const urgencySchema = z.object({
  issueId: z.string().min(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export async function setUrgency(
  _prev: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const ctx = await requireOrg();
  if (!can(ctx.role, "issues:manage")) return { error: "Not authorised." };

  const parsed = urgencySchema.safeParse({
    issueId: formData.get("issueId"),
    urgency: formData.get("urgency"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const issue = await loadOwnedIssue(parsed.data.issueId, ctx.organization.id);
  if (!issue) return { error: "Issue not found." };

  await db.issue.update({
    where: { id: parsed.data.issueId },
    data: { urgency: parsed.data.urgency as IssueUrgency },
  });

  await audit({
    action: "issue.urgency_change",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Issue",
    targetId: parsed.data.issueId,
    metadata: { urgency: parsed.data.urgency },
  });

  revalidatePath(`/issues/${parsed.data.issueId}`);
  return { success: true };
}

// ── Add comment ────────────────────────────────────────────────────────────

const addCommentSchema = z.object({
  issueId: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.coerce.boolean().default(true),
});

export async function addComment(
  _prev: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const ctx = await requireOrg();
  // CLEANER may view and add internal comments
  if (!can(ctx.role, "issues:view")) return { error: "Not authorised." };

  const isInternalRaw = formData.get("isInternal");
  const isInternal = isInternalRaw === "false" ? false : true;

  // Only managers/owners can send guest-facing replies
  if (!isInternal && !can(ctx.role, "issues:manage")) {
    return { error: "Not authorised to send guest-facing replies." };
  }

  const parsed = addCommentSchema.safeParse({
    issueId: formData.get("issueId"),
    body: formData.get("body"),
    isInternal,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const issue = await loadOwnedIssue(parsed.data.issueId, ctx.organization.id);
  if (!issue) return { error: "Issue not found." };

  await db.issueComment.create({
    data: {
      issueId: parsed.data.issueId,
      authorId: ctx.user.id,
      body: parsed.data.body.trim(),
      isInternal: parsed.data.isInternal,
    },
  });

  await audit({
    action: parsed.data.isInternal ? "issue.comment_internal" : "issue.comment_guest",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Issue",
    targetId: parsed.data.issueId,
  });

  // Deliver guest-facing replies to the guest by email (best-effort). Needs a guest
  // email on file AND a configured Resend key to actually send; otherwise it is
  // logged to the server console and NOT delivered.
  let info: string | undefined;
  if (!parsed.data.isInternal) {
    try {
      const full = await db.issue.findUnique({
        where: { id: parsed.data.issueId },
        select: {
          guestContact: true,
          guestName: true,
          property: { select: { publicName: true, slug: true, hostName: true } },
          guestStay: { select: { guestEmail: true, guestName: true } },
        },
      });
      const guestEmail =
        full?.guestStay?.guestEmail ||
        (full?.guestContact && full.guestContact.includes("@") ? full.guestContact.trim() : null);
      if (guestEmail && full?.property) {
        const guestName = full.guestName || full.guestStay?.guestName || "there";
        const host = full.property.hostName || full.property.publicName;
        await sendEmail({
          to: guestEmail,
          subject: `Re: your report — ${full.property.publicName}`,
          text: `Hi ${guestName},\n\n${parsed.data.body.trim()}\n\n— ${host}\n${full.property.publicName}\n${env.appUrl}/g/${full.property.slug}`,
        });
        info = `Reply emailed to the guest (${guestEmail}).`;
      } else {
        info = "Saved — but the guest left no email, so it was not delivered.";
      }
    } catch (err) {
      console.error("[issue] guest reply email failed", err);
      info = "Saved — but sending the email to the guest failed.";
    }
  }

  revalidatePath(`/issues/${parsed.data.issueId}`);
  return { success: true, info };
}

// ── AI: draft guest reply ──────────────────────────────────────────────────

export type DraftReplyState =
  | { error?: string; success?: boolean; draft?: string }
  | undefined;

export async function draftGuestReplyAction(
  _prev: DraftReplyState,
  formData: FormData,
): Promise<DraftReplyState> {
  const ctx = await requireOrg();
  if (!can(ctx.role, "issues:manage")) return { error: "Not authorised." };

  const issueId = String(formData.get("issueId") ?? "");
  const issue = await loadOwnedIssue(issueId, ctx.organization.id);
  if (!issue) return { error: "Issue not found." };

  const issueText = [issue.title, issue.description].filter(Boolean).join("\n");
  const draft = await draftGuestReply(issueText, "EN");

  return { draft };
}
