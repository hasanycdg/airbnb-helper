"use server";

import { z } from "zod";
import { headers } from "next/headers";
import type { IssueCategory, IssueUrgency } from "@prisma/client";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { rateLimit } from "@/lib/ratelimit";
import { hashIp } from "@/lib/utils";

export type GuestActionState = { error?: string; success?: boolean } | undefined;

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

const issueSchema = z.object({
  slug: z.string(),
  title: z.string().min(3, "Please add a short title"),
  category: z.string(),
  description: z.string().optional(),
  urgency: z.string().optional(),
  roomLocation: z.string().optional(),
  guestName: z.string().optional(),
  guestContact: z.string().optional(),
  contactPreference: z.string().optional(),
  photos: z.string().optional(),
  company: z.string().optional(), // honeypot
});

export async function submitIssueAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  const parsed = issueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.company) return { success: true }; // bot caught by honeypot

  const ip = await clientIp();
  if (!rateLimit(`issue:${ip}`, 5, 60_000).ok) {
    return { error: "Too many submissions. Please try again in a minute." };
  }

  const property = await db.property.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, organizationId: true, isPublished: true },
  });
  if (!property || !property.isPublished) return { error: "This guide is not available." };

  const photos = (parsed.data.photos ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const issue = await db.issue.create({
    data: {
      propertyId: property.id,
      organizationId: property.organizationId,
      title: parsed.data.title.trim(),
      category: (parsed.data.category as IssueCategory) ?? "OTHER",
      description: parsed.data.description?.trim() || null,
      urgency: (parsed.data.urgency as IssueUrgency) || "MEDIUM",
      status: "NEW",
      source: "GUEST",
      roomLocation: parsed.data.roomLocation?.trim() || null,
      guestName: parsed.data.guestName?.trim() || null,
      guestContact: parsed.data.guestContact?.trim() || null,
      contactPreference: parsed.data.contactPreference || null,
      photos,
    },
  });

  await trackEvent({
    organizationId: property.organizationId,
    propertyId: property.id,
    type: "ISSUE_CREATED",
    metadata: { issueId: issue.id, category: issue.category },
  });

  return { success: true };
}

const satisfactionSchema = z.object({
  token: z.string(),
  response: z.string(), // "GOOD" or an IssueCategory
  comment: z.string().optional(),
});

export async function submitSatisfactionAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  const parsed = satisfactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please choose an option." };

  const check = await db.satisfactionCheck.findUnique({
    where: { token: parsed.data.token },
    include: {
      property: { select: { id: true, organizationId: true } },
      issue: { select: { id: true } },
    },
  });
  if (!check) return { error: "This link is no longer valid." };

  const isGood = parsed.data.response === "GOOD";
  const category = isGood ? null : (parsed.data.response as IssueCategory);

  await db.satisfactionCheck.update({
    where: { id: check.id },
    data: {
      status: isGood ? "GOOD" : "PROBLEM",
      problemCategory: category,
      comment: parsed.data.comment?.trim() || null,
      respondedAt: new Date(),
    },
  });

  if (!isGood && !check.issue) {
    await db.issue.create({
      data: {
        propertyId: check.property.id,
        organizationId: check.property.organizationId,
        guestStayId: check.guestStayId,
        satisfactionCheckId: check.id,
        title: `Satisfaction check: ${category}`,
        category: category ?? "OTHER",
        description: parsed.data.comment?.trim() || null,
        urgency: "HIGH",
        status: "NEW",
        source: "SATISFACTION",
      },
    });
  }

  await trackEvent({
    organizationId: check.property.organizationId,
    propertyId: check.property.id,
    type: "SATISFACTION_SUBMITTED",
    value: isGood ? 1 : 0,
  });

  return { success: true };
}
