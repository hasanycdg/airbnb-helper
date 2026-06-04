import "server-only";
import type { AnalyticsEventType, Locale, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Best-effort analytics. Failures here must never break a user or guest flow,
 * so every write is wrapped and swallowed on error.
 */
export async function trackEvent(input: {
  organizationId: string;
  type: AnalyticsEventType;
  propertyId?: string | null;
  sectionId?: string | null;
  qrCodeId?: string | null;
  locale?: Locale | null;
  value?: number | null;
  sessionId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        propertyId: input.propertyId ?? null,
        sectionId: input.sectionId ?? null,
        qrCodeId: input.qrCodeId ?? null,
        locale: input.locale ?? null,
        value: input.value ?? null,
        sessionId: input.sessionId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    console.error("[analytics] failed to record event", err);
  }
}

export async function trackGuideView(input: {
  organizationId: string;
  propertyId: string;
  sectionId?: string | null;
  locale?: Locale | null;
  sessionId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
}): Promise<void> {
  try {
    await db.$transaction([
      db.guestGuideViewEvent.create({
        data: {
          propertyId: input.propertyId,
          sectionId: input.sectionId ?? null,
          locale: input.locale ?? null,
          sessionId: input.sessionId ?? null,
          referrer: input.referrer ?? null,
          userAgent: input.userAgent ?? null,
          ipHash: input.ipHash ?? null,
        },
      }),
      db.analyticsEvent.create({
        data: {
          organizationId: input.organizationId,
          propertyId: input.propertyId,
          sectionId: input.sectionId ?? null,
          type: input.sectionId ? "SECTION_VIEW" : "GUIDE_VIEW",
          locale: input.locale ?? null,
          sessionId: input.sessionId ?? null,
        },
      }),
    ]);
  } catch (err) {
    console.error("[analytics] failed to record view", err);
  }
}
