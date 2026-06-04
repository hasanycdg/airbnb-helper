"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, setActiveOrg } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { canInviteMember } from "@/lib/usage";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export type State = { error?: string; success?: boolean } | undefined;

// ── Invite member ────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("A valid email address is required."),
  role: z.enum(["OWNER", "MANAGER", "CLEANER"]),
});

export async function inviteMember(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  if (!ctx.role || !["OWNER", "MANAGER"].includes(ctx.role)) {
    return { error: "You do not have permission to invite members." };
  }

  const plan = ctx.organization.subscription?.plan ?? "TRIAL";
  const limit = await canInviteMember(ctx.organization.id, plan);
  if (!limit.allowed) return { error: limit.reason };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, role } = parsed.data;

  // Check if user is already a member.
  const existingMember = await db.organizationMember.findFirst({
    where: {
      organizationId: ctx.organization.id,
      user: { email },
    },
  });
  if (existingMember) {
    return { error: "This person is already a member of your organisation." };
  }

  // Revoke any existing pending invitation for this email.
  await db.invitation.updateMany({
    where: {
      organizationId: ctx.organization.id,
      email,
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days

  const invitation = await db.invitation.create({
    data: {
      organizationId: ctx.organization.id,
      email,
      role: role as Role,
      token,
      expiresAt,
      invitedById: ctx.user.id,
    },
  });

  const acceptUrl = `${env.appUrl}/invite/${token}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to ${ctx.organization.name} on StayGuide Pro`,
    text: [
      `Hi there,`,
      ``,
      `${ctx.user.name ?? "A team member"} has invited you to join ${ctx.organization.name} on StayGuide Pro as a ${role.charAt(0) + role.slice(1).toLowerCase()}.`,
      ``,
      `Accept your invitation by clicking the link below:`,
      acceptUrl,
      ``,
      `This invitation expires in 7 days.`,
      ``,
      `If you weren't expecting this invitation, you can safely ignore it.`,
    ].join("\n"),
    html: `
      <p>Hi there,</p>
      <p><strong>${ctx.user.name ?? "A team member"}</strong> has invited you to join <strong>${ctx.organization.name}</strong> on StayGuide Pro as a <strong>${role.charAt(0) + role.slice(1).toLowerCase()}</strong>.</p>
      <p><a href="${acceptUrl}" style="background:#0F766E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept invitation</a></p>
      <p>Or copy this link: <code>${acceptUrl}</code></p>
      <p style="color:#6b7280;font-size:0.875rem;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
    `,
  });

  await audit({
    action: "member.invite",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Invitation",
    targetId: invitation.id,
    metadata: { email, role },
  });

  revalidatePath("/settings/team");
  return { success: true };
}

// ── Resend invitation ────────────────────────────────────────────────────────

export async function resendInvitation(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const invitationId = String(formData.get("invitationId"));

  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, organizationId: ctx.organization.id, status: "PENDING" },
  });
  if (!invitation) return { error: "Invitation not found." };

  // Refresh expiry.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.invitation.update({
    where: { id: invitationId },
    data: { expiresAt },
  });

  const acceptUrl = `${env.appUrl}/invite/${invitation.token}`;

  await sendEmail({
    to: invitation.email,
    subject: `Reminder: You've been invited to ${ctx.organization.name} on StayGuide Pro`,
    text: [
      `Hi there,`,
      ``,
      `This is a reminder that you have a pending invitation to join ${ctx.organization.name} on StayGuide Pro.`,
      ``,
      `Accept your invitation: ${acceptUrl}`,
      ``,
      `This invitation now expires in 7 days.`,
    ].join("\n"),
    html: `
      <p>Hi there,</p>
      <p>This is a reminder that you have a pending invitation to join <strong>${ctx.organization.name}</strong> on StayGuide Pro.</p>
      <p><a href="${acceptUrl}" style="background:#0F766E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept invitation</a></p>
      <p style="color:#6b7280;font-size:0.875rem;">This invitation now expires in 7 days.</p>
    `,
  });

  await audit({
    action: "member.invite_resend",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Invitation",
    targetId: invitationId,
  });

  revalidatePath("/settings/team");
  return { success: true };
}

// ── Revoke invitation ────────────────────────────────────────────────────────

export async function revokeInvitation(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const invitationId = String(formData.get("invitationId"));

  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, organizationId: ctx.organization.id },
  });
  if (!invitation) return;

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });

  await audit({
    action: "member.invite_revoke",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "Invitation",
    targetId: invitationId,
  });

  revalidatePath("/settings/team");
}

// ── Change member role ───────────────────────────────────────────────────────

const changeRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["OWNER", "MANAGER", "CLEANER"]),
});

export async function changeRole(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const parsed = changeRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { memberId, role } = parsed.data;

  const member = await db.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!member) return { error: "Member not found." };

  // Prevent demoting yourself if you're the only OWNER.
  if (member.userId === ctx.user.id && role !== "OWNER") {
    const ownerCount = await db.organizationMember.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { error: "You cannot change your role — you are the only owner." };
    }
  }

  await db.organizationMember.update({
    where: { id: memberId },
    data: { role: role as Role },
  });

  await audit({
    action: "member.role_change",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "OrganizationMember",
    targetId: memberId,
    metadata: { newRole: role, email: member.user.email },
  });

  revalidatePath("/settings/team");
  return { success: true };
}

// ── Remove member ────────────────────────────────────────────────────────────

export async function removeMember(formData: FormData): Promise<void> {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  const memberId = String(formData.get("memberId"));

  const member = await db.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
  });
  if (!member) return;

  // Never remove the last OWNER.
  if (member.role === "OWNER") {
    const ownerCount = await db.organizationMember.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (ownerCount <= 1) return;
  }

  await db.organizationMember.delete({ where: { id: memberId } });

  await audit({
    action: "member.remove",
    organizationId: ctx.organization.id,
    actorUserId: ctx.user.id,
    targetType: "OrganizationMember",
    targetId: memberId,
  });

  revalidatePath("/settings/team");
}

// ── Accept invitation ────────────────────────────────────────────────────────

export async function acceptInvitation(token: string): Promise<
  | { ok: true; orgId: string }
  | { ok: false; error: "expired" | "used" | "not_found" | "unauthenticated" }
> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { ok: false, error: "unauthenticated" };

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) return { ok: false, error: "not_found" };
  if (invitation.status === "ACCEPTED") return { ok: false, error: "used" };
  if (invitation.status === "REVOKED" || invitation.status === "EXPIRED") {
    return { ok: false, error: "expired" };
  }
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    return { ok: false, error: "expired" };
  }

  // Check if already a member.
  const existing = await db.organizationMember.findFirst({
    where: { organizationId: invitation.organizationId, userId: session.userId },
  });

  await db.$transaction(async (tx) => {
    if (!existing) {
      await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: session.userId,
          role: invitation.role,
        },
      });
    }
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  });

  // Switch session to the new org.
  await setActiveOrg(invitation.organizationId);

  await audit({
    action: "member.accept_invite",
    organizationId: invitation.organizationId,
    actorUserId: session.userId,
    targetType: "Invitation",
    targetId: invitation.id,
  });

  return { ok: true, orgId: invitation.organizationId };
}
