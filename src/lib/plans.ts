import { PlanTier } from "@prisma/client";

/**
 * Subscription plans and the limits each one enforces. Limit value `null`
 * means "unlimited". These are checked server-side before creating
 * properties, inviting members, uploading videos, sending AI messages, etc.
 */
export interface PlanLimits {
  properties: number | null;
  teamMembers: number | null;
  videosPerProperty: number | null;
  aiMessagesPerMonth: number | null;
  storageMb: number | null;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthly: number; // in EUR cents
  tagline: string;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  TRIAL: {
    tier: "TRIAL",
    name: "Free trial",
    priceMonthly: 0,
    tagline: "14 days, full Pro access",
    limits: {
      properties: 1,
      teamMembers: 2,
      videosPerProperty: 5,
      aiMessagesPerMonth: 100,
      storageMb: 500,
    },
    features: ["1 property", "Digital guide", "Video FAQ", "AI assistant (trial)"],
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    priceMonthly: 900,
    tagline: "For a single property",
    limits: {
      properties: 1,
      teamMembers: 2,
      videosPerProperty: 3,
      aiMessagesPerMonth: 0,
      storageMb: 1000,
    },
    features: ["1 property", "Digital guest guide", "Main QR code", "Print materials"],
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    priceMonthly: 1900,
    tagline: "Multilingual guides & automation",
    limits: {
      properties: 3,
      teamMembers: 5,
      videosPerProperty: 20,
      aiMessagesPerMonth: 0,
      storageMb: 5000,
    },
    features: [
      "Up to 3 properties",
      "Video FAQ system",
      "Multilingual content + AI translation",
      "Automated message templates",
      "Analytics",
    ],
    highlighted: true,
  },
  PREMIUM: {
    tier: "PREMIUM",
    name: "Premium",
    priceMonthly: 3900,
    tagline: "Guest AI & operations",
    limits: {
      properties: 10,
      teamMembers: 15,
      videosPerProperty: 50,
      aiMessagesPerMonth: 2000,
      storageMb: 20000,
    },
    features: [
      "Up to 10 properties",
      "Guest AI assistant",
      "Issue reporting",
      "Cleaning & turnover",
      "Restocking & inventory",
      "Review assistant",
    ],
  },
  MANAGER: {
    tier: "MANAGER",
    name: "Manager",
    priceMonthly: 9900,
    tagline: "For property managers & teams",
    limits: {
      properties: null,
      teamMembers: null,
      videosPerProperty: null,
      aiMessagesPerMonth: 10000,
      storageMb: 100000,
    },
    features: [
      "Unlimited properties",
      "Team roles & permissions",
      "Advanced analytics",
      "White-label branding",
      "Priority support",
    ],
  },
};

export const PAID_PLANS: PlanTier[] = ["STARTER", "PRO", "PREMIUM", "MANAGER"];

/** Which plans unlock a given capability. Used for upsell gating in the UI. */
export const PLAN_CAPABILITIES = {
  videoFaq: ["PRO", "PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  multilingual: ["PRO", "PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  automatedMessages: ["PRO", "PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  analytics: ["PRO", "PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  aiAssistant: ["PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  issues: ["PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  cleaning: ["PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  restocking: ["PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  reviewAssistant: ["PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
  whiteLabel: ["MANAGER"] as PlanTier[],
  teamRoles: ["PRO", "PREMIUM", "MANAGER", "TRIAL"] as PlanTier[],
} satisfies Record<string, PlanTier[]>;

export type Capability = keyof typeof PLAN_CAPABILITIES;

export function planHasCapability(tier: PlanTier, capability: Capability): boolean {
  return PLAN_CAPABILITIES[capability].includes(tier);
}

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLANS[tier].limits;
}
