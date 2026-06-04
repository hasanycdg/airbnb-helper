import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

/** Stripe API versions we handle */
type CheckoutSession = Stripe.Checkout.Session;
type StripeSubscription = Stripe.Subscription;

// Stripe status → our SubscriptionStatus enum
function mapStatus(s: StripeSubscription["status"]): SubscriptionStatus {
  switch (s) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
    case "unpaid":
    case "paused":
    default:
      return "INCOMPLETE";
  }
}

/** Resolve plan from the subscription metadata or price id. */
function planFromSubscription(sub: StripeSubscription): PlanTier {
  // We stash the plan in subscription_data.metadata when creating the checkout.
  const metaPlan = sub.metadata?.plan as PlanTier | undefined;
  if (
    metaPlan &&
    ["STARTER", "PRO", "PREMIUM", "MANAGER"].includes(metaPlan)
  ) {
    return metaPlan;
  }
  // Fallback: compare against configured price IDs
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const prices = env.stripe.prices;
  if (priceId === prices.STARTER) return "STARTER";
  if (priceId === prices.PRO) return "PRO";
  if (priceId === prices.PREMIUM) return "PREMIUM";
  if (priceId === prices.MANAGER) return "MANAGER";
  return "STARTER"; // safe default
}

async function handleCheckoutCompleted(session: CheckoutSession): Promise<void> {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as PlanTier | undefined;

  if (!organizationId || !plan) {
    console.warn("[stripe/webhook] checkout.session.completed missing metadata", session.id);
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await db.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      plan,
      status: "ACTIVE",
      stripeCustomerId,
      stripeSubscriptionId,
    },
    update: {
      plan,
      status: "ACTIVE",
      stripeCustomerId,
      stripeSubscriptionId,
    },
  });
}

async function handleSubscriptionChange(sub: StripeSubscription): Promise<void> {
  const organizationId = sub.metadata?.organizationId;
  if (!organizationId) {
    console.warn("[stripe/webhook] subscription event missing organizationId metadata", sub.id);
    return;
  }

  const plan = planFromSubscription(sub);
  const status = mapStatus(sub.status);
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const currentPeriodEnd =
    sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  await db.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      plan,
      status,
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price?.id ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      plan,
      status,
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price?.id ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(sub: StripeSubscription): Promise<void> {
  const organizationId = sub.metadata?.organizationId;
  if (!organizationId) return;

  await db.subscription.updateMany({
    where: { organizationId },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = env.stripe.webhookSecret;

  // No webhook secret configured → noop (offline / mock mode).
  if (!webhookSecret) {
    return NextResponse.json({ received: true, mode: "noop" }, { status: 200 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ received: true, mode: "noop" }, { status: 200 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as CheckoutSession);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as StripeSubscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as StripeSubscription);
        break;

      default:
        // Ignore unhandled event types.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", event.type, err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
