/**
 * Centralised environment access with graceful fallbacks.
 *
 * StayGuide Pro is designed to run fully offline for local development:
 * every external integration (OpenAI, Stripe, Resend, S3) degrades to a
 * mock/local implementation when its credentials are absent. `features`
 * exposes which integrations are live so the UI can adapt.
 */

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  authSecret:
    process.env.AUTH_SECRET ??
    "dev-only-insecure-secret-change-me-in-production-0000",
  databaseUrl: process.env.DATABASE_URL ?? "",

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    prices: {
      STARTER: process.env.STRIPE_PRICE_STARTER ?? "",
      PRO: process.env.STRIPE_PRICE_PRO ?? "",
      PREMIUM: process.env.STRIPE_PRICE_PREMIUM ?? "",
      MANAGER: process.env.STRIPE_PRICE_MANAGER ?? "",
    },
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "StayGuide Pro <hello@example.com>",
    // Where host support requests are delivered. Falls back to the address
    // parsed out of EMAIL_FROM when unset.
    supportEmail: process.env.SUPPORT_EMAIL ?? "",
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "auto",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.S3_BUCKET ?? "stayguide-media",
    publicUrl: process.env.S3_PUBLIC_URL ?? "",
  },
};

export const features = {
  ai: Boolean(env.openai.apiKey),
  stripe: Boolean(env.stripe.secretKey),
  email: Boolean(env.email.resendApiKey),
  s3: Boolean(env.s3.endpoint && env.s3.accessKeyId && env.s3.secretAccessKey),
};

export const isProd = process.env.NODE_ENV === "production";
