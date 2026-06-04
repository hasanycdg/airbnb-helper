"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/stripe";

export type BillingState = { error?: string; success?: boolean } | undefined;

const changePlanSchema = z.object({
  plan: z.enum(["TRIAL", "STARTER", "PRO", "PREMIUM", "MANAGER"]),
});

/**
 * Change the subscription plan for the active organization.
 *
 * In live Stripe mode: redirects to a Stripe Checkout URL.
 * In mock mode (no STRIPE_SECRET_KEY): updates the DB directly and returns success.
 */
export async function changePlan(
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const ctx = await requireRole(["OWNER"]);

  const parsed = changePlanSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) return { error: "Invalid plan selected." };

  const newPlan = parsed.data.plan as PlanTier;
  const orgId = ctx.organization.id;
  const currentPlan = ctx.organization.subscription?.plan ?? "TRIAL";

  if (newPlan === currentPlan) {
    return { error: "You are already on that plan." };
  }

  const stripeCustomerId = ctx.organization.subscription?.stripeCustomerId;

  // Try to start a Stripe Checkout session — returns null in mock/offline mode.
  const checkoutUrl = await createCheckoutSession({
    plan: newPlan,
    organizationId: orgId,
    customerEmail: ctx.user.email,
    stripeCustomerId: stripeCustomerId ?? null,
  });

  if (checkoutUrl) {
    // Live Stripe: hand off to Stripe Checkout (webhook will sync subscription).
    redirect(checkoutUrl);
  }

  // Mock mode: apply the plan change immediately in the DB.
  await db.subscription.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      plan: newPlan,
      status: newPlan === "TRIAL" ? "TRIALING" : "ACTIVE",
    },
    update: {
      plan: newPlan,
      status: newPlan === "TRIAL" ? "TRIALING" : "ACTIVE",
      cancelAtPeriodEnd: false,
    },
  });

  await audit({
    action: "billing.changePlan",
    organizationId: orgId,
    actorUserId: ctx.user.id,
    targetType: "Subscription",
    targetId: ctx.organization.subscription?.id,
    metadata: { from: currentPlan, to: newPlan, mode: "mock" },
  });

  revalidatePath("/settings/billing");
  return { success: true };
}

/**
 * Open the Stripe billing portal (manage payment method, invoices, cancel).
 * Only available when a Stripe customer ID exists; falls back to error in mock mode.
 */
export async function openPortal(_prev: BillingState, _formData: FormData): Promise<BillingState> {
  const ctx = await requireRole(["OWNER"]);

  const stripeCustomerId = ctx.organization.subscription?.stripeCustomerId;
  if (!stripeCustomerId) {
    return { error: "No Stripe subscription found. Manage billing by changing your plan." };
  }

  const portalUrl = await createBillingPortalSession(stripeCustomerId);
  if (!portalUrl) {
    return { error: "Billing portal is not available in this environment." };
  }

  redirect(portalUrl);
}
