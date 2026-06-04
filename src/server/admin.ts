"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin, setActiveOrg } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PLANS } from "@/lib/plans";
import type { PlanTier } from "@prisma/client";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminSetting(key: string): Promise<string | null> {
  const row = await db.adminSetting.findUnique({ where: { key } });
  if (!row) return null;
  const val = row.value;
  if (typeof val === "string") return val;
  if (typeof val === "boolean") return String(val);
  return String(val);
}

async function setAdminSetting(key: string, value: string): Promise<void> {
  await db.adminSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

// ── Data fetchers (called from server components) ─────────────────────────────

export async function getAdminOverviewStats() {
  const session = await requireSuperAdmin();
  void session;

  const [
    totalOrgs,
    totalUsers,
    totalProperties,
    activeSubscriptions,
    aiAnswerLogs,
    recentOrgs,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.property.count(),
    db.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] }, plan: { not: "TRIAL" } },
      select: { plan: true },
    }),
    db.aIAnswerLog.count(),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        subscription: { select: { plan: true, status: true } },
        _count: { select: { members: true, properties: true } },
      },
    }),
  ]);

  const signupsEnabled = (await getAdminSetting("platform.signupsEnabled")) ?? "true";

  // Compute estimated MRR from ACTIVE (non-trial) subscriptions
  const estimatedMrrCents = activeSubscriptions.reduce((acc, s) => {
    const plan = PLANS[s.plan as PlanTier];
    return acc + (plan?.priceMonthly ?? 0);
  }, 0);

  return {
    totalOrgs,
    totalUsers,
    totalProperties,
    activeSubscriptionCount: activeSubscriptions.length,
    estimatedMrrCents,
    aiAnswerLogs,
    signupsEnabled: signupsEnabled !== "false",
    recentOrgs: recentOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.subscription?.plan ?? "TRIAL",
      status: org.subscription?.status ?? "TRIALING",
      memberCount: org._count.members,
      propertyCount: org._count.properties,
      createdAt: org.createdAt,
    })),
  };
}

export async function getAllOrganizations() {
  const session = await requireSuperAdmin();
  void session;

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      _count: { select: { members: true, properties: true } },
    },
  });

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.subscription?.plan ?? "TRIAL",
    status: org.subscription?.status ?? "TRIALING",
    currentPeriodEnd: org.subscription?.currentPeriodEnd ?? null,
    memberCount: org._count.members,
    propertyCount: org._count.properties,
    createdAt: org.createdAt,
  }));
}

export async function getAllUsers() {
  const session = await requireSuperAdmin();
  void session;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { organization: { select: { name: true } } },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isSuperAdmin: u.isSuperAdmin,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    orgs: u.memberships.map((m) => ({
      id: m.organizationId,
      name: m.organization.name,
      role: m.role,
    })),
  }));
}

export async function getAllSubscriptions() {
  const session = await requireSuperAdmin();
  void session;

  const subs = await db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true, slug: true } } },
  });

  return subs.map((s) => ({
    id: s.id,
    orgId: s.organizationId,
    orgName: s.organization.name,
    orgSlug: s.organization.slug,
    plan: s.plan,
    status: s.status,
    stripeCustomerId: s.stripeCustomerId,
    currentPeriodEnd: s.currentPeriodEnd,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    createdAt: s.createdAt,
  }));
}

export async function getAuditLogs() {
  const session = await requireSuperAdmin();
  void session;

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { email: true, name: true } },
      organization: { select: { name: true } },
    },
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    actorEmail: l.actor?.email ?? null,
    actorName: l.actor?.name ?? null,
    orgName: l.organization?.name ?? null,
    organizationId: l.organizationId,
    targetType: l.targetType,
    targetId: l.targetId,
    metadata: l.metadata,
    createdAt: l.createdAt,
  }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

const impersonateSchema = z.object({
  organizationId: z.string().min(1),
});

/**
 * Allow a super-admin to impersonate an organization.
 * Records an audit log entry, creates a transient OWNER membership if needed,
 * sets the active org in the session cookie, then redirects to /dashboard.
 *
 * IMPORTANT: This grants temporary platform-support access. The membership
 * record documents who accessed the org and when.
 */
export async function impersonateOrganization(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireSuperAdmin();

  const parsed = impersonateSchema.safeParse({
    organizationId: formData.get("organizationId"),
  });
  if (!parsed.success) return { error: "Invalid organization ID." };

  const { organizationId } = parsed.data;

  // Ensure the org exists
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  });
  if (!org) return { error: "Organization not found." };

  // Check if the super-admin is already a member
  const existing = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: session.userId } },
  });

  if (!existing) {
    // Create a transient OWNER membership to document the access
    await db.organizationMember.create({
      data: {
        organizationId,
        userId: session.userId,
        role: "OWNER",
      },
    });
  }

  await audit({
    action: "admin.impersonate",
    organizationId,
    actorUserId: session.userId,
    targetType: "Organization",
    targetId: organizationId,
    metadata: { adminEmail: session.email, orgName: org.name },
  });

  await setActiveOrg(organizationId);
  redirect("/dashboard");
}

const toggleSignupsSchema = z.object({
  enabled: z.enum(["true", "false"]),
});

/** Toggle whether new user signups are allowed on the platform. */
export async function toggleSignups(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireSuperAdmin();

  const parsed = toggleSignupsSchema.safeParse({
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) return { error: "Invalid value." };

  const { enabled } = parsed.data;
  await setAdminSetting("platform.signupsEnabled", enabled);

  await audit({
    action: "admin.toggleSignups",
    actorUserId: session.userId,
    metadata: { signupsEnabled: enabled === "true" },
  });

  revalidatePath("/admin");
  return { success: true };
}
