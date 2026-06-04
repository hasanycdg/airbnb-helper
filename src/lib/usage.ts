import "server-only";
import type { PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";

export interface UsageSnapshot {
  plan: PlanTier;
  properties: { used: number; limit: number | null };
  teamMembers: { used: number; limit: number | null };
  aiMessages: { used: number; limit: number | null };
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getOrgUsage(organizationId: string, plan: PlanTier): Promise<UsageSnapshot> {
  const limits = getPlanLimits(plan);

  const [properties, teamMembers, aiMessages] = await Promise.all([
    db.property.count({ where: { organizationId } }),
    db.organizationMember.count({ where: { organizationId } }),
    db.aIAnswerLog.count({
      where: { property: { organizationId }, createdAt: { gte: startOfMonth() } },
    }),
  ]);

  return {
    plan,
    properties: { used: properties, limit: limits.properties },
    teamMembers: { used: teamMembers, limit: limits.teamMembers },
    aiMessages: { used: aiMessages, limit: limits.aiMessagesPerMonth },
  };
}

export interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
  reason?: string;
}

function check(used: number, limit: number | null, label: string): LimitCheck {
  if (limit === null) return { allowed: true, used, limit };
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Your plan allows ${limit} ${label}. Upgrade to add more.`,
    };
  }
  return { allowed: true, used, limit };
}

export async function canCreateProperty(
  organizationId: string,
  plan: PlanTier,
): Promise<LimitCheck> {
  const used = await db.property.count({ where: { organizationId } });
  return check(used, getPlanLimits(plan).properties, "properties");
}

export async function canInviteMember(
  organizationId: string,
  plan: PlanTier,
): Promise<LimitCheck> {
  const used = await db.organizationMember.count({ where: { organizationId } });
  return check(used, getPlanLimits(plan).teamMembers, "team members");
}

export async function canSendAiMessage(
  organizationId: string,
  plan: PlanTier,
): Promise<LimitCheck> {
  const used = await db.aIAnswerLog.count({
    where: { property: { organizationId }, createdAt: { gte: startOfMonth() } },
  });
  return check(used, getPlanLimits(plan).aiMessagesPerMonth, "AI messages this month");
}

export async function canUploadVideo(
  propertyId: string,
  plan: PlanTier,
): Promise<LimitCheck> {
  const used = await db.guideMedia.count({ where: { propertyId, type: "VIDEO" } });
  return check(used, getPlanLimits(plan).videosPerProperty, "videos per property");
}
