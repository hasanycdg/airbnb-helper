import "server-only";
import Stripe from "stripe";
import type { PlanTier } from "@prisma/client";
import { env, features } from "@/lib/env";

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!features.stripe) return null;
  // Pin to the SDK's expected version; cast keeps us resilient to SDK bumps.
  if (!stripe)
    stripe = new Stripe(env.stripe.secretKey, {
      apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
    });
  return stripe;
}

export function priceIdFor(plan: PlanTier): string | null {
  if (plan === "TRIAL") return null;
  return env.stripe.prices[plan as Exclude<PlanTier, "TRIAL">] || null;
}

/**
 * Starts a Stripe Checkout session for a plan upgrade. Returns a redirect URL,
 * or null when Stripe is not configured (the caller then applies the plan
 * change directly — "mock billing" mode for local development).
 */
export async function createCheckoutSession(params: {
  plan: PlanTier;
  organizationId: string;
  customerEmail: string;
  stripeCustomerId?: string | null;
}): Promise<string | null> {
  const client = getStripe();
  const price = priceIdFor(params.plan);
  if (!client || !price) return null;

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: params.stripeCustomerId || undefined,
    customer_email: params.stripeCustomerId ? undefined : params.customerEmail,
    line_items: [{ price, quantity: 1 }],
    success_url: `${env.appUrl}/settings/billing?status=success`,
    cancel_url: `${env.appUrl}/settings/billing?status=cancelled`,
    metadata: { organizationId: params.organizationId, plan: params.plan },
    subscription_data: { metadata: { organizationId: params.organizationId } },
  });
  return session.url;
}

export async function createBillingPortalSession(
  stripeCustomerId: string,
): Promise<string | null> {
  const client = getStripe();
  if (!client) return null;
  const session = await client.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${env.appUrl}/settings/billing`,
  });
  return session.url;
}

export const billingMode = features.stripe ? "stripe" : "mock";
