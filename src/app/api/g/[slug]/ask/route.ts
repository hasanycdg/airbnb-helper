import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPublishedGuide, buildKnowledge } from "@/lib/guide-data";
import { answerGuestQuestion } from "@/lib/ai";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { rateLimit } from "@/lib/ratelimit";

/** Guest AI assistant — grounded in the property's approved guide content. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";

  if (!rateLimit(`ask:${slug}:${ip}`, 15, 60_000).ok) {
    return NextResponse.json({ error: "Too many questions, please slow down." }, { status: 429 });
  }

  let body: { question?: string; locale?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Empty question." }, { status: 400 });

  const guide = await getPublishedGuide(slug, body.locale ?? null);
  if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });
  if (!guide.property.aiEnabled) {
    return NextResponse.json({ error: "The assistant is disabled for this property." }, { status: 403 });
  }
  const locale = guide.locale;

  const result = await answerGuestQuestion({
    question,
    locale,
    sections: buildKnowledge(guide),
    propertyName: guide.property.publicName,
    confidenceThreshold: 0.6,
  });

  // Persist the question and the AI answer log for the host inbox.
  const gq = await db.guestQuestion.create({
    data: {
      propertyId: guide.property.id,
      question,
      locale,
      answered: result.canAnswer,
      answerText: result.canAnswer ? result.answer : null,
      matchedSectionId: result.usedSectionIds[0] ?? null,
      confidence: result.confidence,
      escalated: !result.canAnswer,
      suggestedFaq: !result.canAnswer,
      sessionId: body.sessionId ?? null,
    },
  });
  await db.aIAnswerLog.create({
    data: {
      propertyId: guide.property.id,
      guestQuestionId: gq.id,
      prompt: question,
      response: result.answer,
      model: result.fallback ? "fallback-retrieval" : "openai",
      locale,
      confidence: result.confidence,
      usedSectionIds: result.usedSectionIds,
      fallback: result.fallback,
    },
  });

  await trackEvent({
    organizationId: guide.organizationId,
    propertyId: guide.property.id,
    type: result.canAnswer ? "AI_QUESTION" : "AI_UNANSWERED",
    locale,
    sessionId: body.sessionId ?? null,
  });

  const matched = result.usedSectionIds[0]
    ? guide.sections.find((s) => s.id === result.usedSectionIds[0])
    : null;

  return NextResponse.json({
    answer: result.answer,
    canAnswer: result.canAnswer,
    confidence: result.confidence,
    section: matched ? { slug: matched.slug, title: matched.title } : null,
  });
}
