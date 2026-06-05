import "server-only";
import OpenAI from "openai";
import type { Locale } from "@prisma/client";
import { env, features } from "@/lib/env";
import { LOCALE_LABELS } from "@/lib/constants";

/**
 * Controlled AI layer. Every guest-facing call is grounded ONLY in approved
 * property content and must refuse to invent details. When no OpenAI key is
 * configured the module falls back to deterministic retrieval / templating so
 * the product remains fully functional offline (and in CI).
 */

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!features.ai) return null;
  if (!client) client = new OpenAI({ apiKey: env.openai.apiKey });
  return client;
}

function localeName(locale: Locale): string {
  return LOCALE_LABELS[locale]?.name ?? "English";
}

// ── Guest assistant (grounded, guard-railed) ───────────────────────────────

export interface KnowledgeSection {
  id: string;
  title: string;
  slug: string;
  content: string;
  shortDescription?: string | null;
}

export interface GuestAnswer {
  canAnswer: boolean;
  answer: string;
  confidence: number; // 0..1
  usedSectionIds: string[];
  fallback: boolean; // true when produced without the LLM
}

const REFUSAL_PROMPT = `You are the digital concierge for a single vacation rental property.
STRICT RULES:
- Use ONLY the APPROVED CONTENT below as your source of truth. Never invent or guess house rules, check-in steps, codes, parking, prices, pet policy, legal or emergency details.
- Answer EVERY part of the question that the approved content covers. For any part it does NOT cover, do not guess — briefly note you're not sure about that specific part and that the host can help. A multi-part question may be partly answered and partly deferred in the SAME reply.
- Set "canAnswer" to true if the approved content lets you answer at least one part of the question; set it to false only if the content covers none of it.
- Preserve exact codes, WiFi names/passwords, addresses and URLs verbatim. Reply in the guest's language, warm and concise.
- Return STRICT JSON: {"canAnswer": boolean, "answer": string, "confidence": number (0-1), "usedSectionIds": string[]}. "confidence" = how certain you are about the information you DID provide (not how much of the question you covered).`;

export async function answerGuestQuestion(params: {
  question: string;
  locale: Locale;
  sections: KnowledgeSection[];
  propertyName: string;
  extraInstructions?: string | null;
  confidenceThreshold: number;
}): Promise<GuestAnswer> {
  const { question, locale, sections, propertyName, extraInstructions, confidenceThreshold } =
    params;

  const ai = getClient();
  if (!ai) {
    return retrievalFallback(question, sections, confidenceThreshold);
  }

  const knowledge = sections
    .map(
      (s) =>
        `### Section "${s.title}" (id: ${s.id})\n${s.shortDescription ? s.shortDescription + "\n" : ""}${s.content}`,
    )
    .join("\n\n");

  try {
    const completion = await ai.chat.completions.create({
      model: env.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: REFUSAL_PROMPT + (extraInstructions ? `\nHost note: ${extraInstructions}` : "") },
        {
          role: "user",
          content: `Property: ${propertyName}\nGuest language: ${localeName(locale)}\n\nAPPROVED CONTENT:\n${knowledge}\n\nGUEST QUESTION: ${question}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<GuestAnswer>;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0)));
    const canAnswer = Boolean(parsed.canAnswer) && confidence >= confidenceThreshold;

    return {
      canAnswer,
      answer: canAnswer
        ? String(parsed.answer ?? "")
        : notSureMessage(locale),
      confidence,
      usedSectionIds: Array.isArray(parsed.usedSectionIds) ? parsed.usedSectionIds : [],
      fallback: false,
    };
  } catch {
    return retrievalFallback(question, sections, confidenceThreshold);
  }
}

/** Keyword-overlap retrieval used when the LLM is unavailable. */
function retrievalFallback(
  question: string,
  sections: KnowledgeSection[],
  threshold: number,
): GuestAnswer {
  const terms = tokenize(question);
  let best: { section: KnowledgeSection; score: number } | null = null;

  for (const section of sections) {
    const haystack = tokenize(`${section.title} ${section.shortDescription ?? ""} ${section.content}`);
    const hay = new Set(haystack);
    const overlap = terms.filter((t) => hay.has(t)).length;
    const score = terms.length ? overlap / terms.length : 0;
    if (!best || score > best.score) best = { section, score };
  }

  if (best && best.score >= Math.min(threshold, 0.34)) {
    return {
      canAnswer: true,
      answer: best.section.content || best.section.shortDescription || best.section.title,
      confidence: Math.min(0.8, 0.4 + best.score),
      usedSectionIds: [best.section.id],
      fallback: true,
    };
  }

  return {
    canAnswer: false,
    answer: notSureMessage("EN"),
    confidence: best?.score ?? 0,
    usedSectionIds: [],
    fallback: true,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüßà-ÿ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function notSureMessage(locale: Locale): string {
  const map: Partial<Record<Locale, string>> = {
    EN: "I'm not totally sure about that one. I'll pass your question to the host so they can help you directly.",
    DE: "Da bin ich mir nicht ganz sicher. Ich leite deine Frage an den Gastgeber weiter, damit er dir direkt helfen kann.",
    IT: "Non ne sono del tutto sicuro. Inoltrerò la tua domanda all'host così potrà aiutarti direttamente.",
    FR: "Je ne suis pas tout à fait sûr. Je transmets votre question à l'hôte pour qu'il puisse vous aider.",
    NL: "Daar ben ik niet helemaal zeker van. Ik stuur je vraag door naar de host.",
    ES: "No estoy del todo seguro. Pasaré tu pregunta al anfitrión para que pueda ayudarte.",
    TR: "Bundan tam emin değilim. Sorunu ev sahibine ileteceğim, böylece sana doğrudan yardımcı olabilir.",
  };
  return map[locale] ?? map.EN!;
}

// ── Host content tools ──────────────────────────────────────────────────────

async function complete(system: string, user: string, temperature = 0.6): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const res = await ai.chat.completions.create({
      model: env.openai.model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return res.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function generateGuideDraft(
  notes: string,
  sectionLabel: string,
  locale: Locale,
): Promise<string> {
  const out = await complete(
    `You write clear, friendly vacation-rental guide content. Keep it practical and concise. Write in ${localeName(locale)}. Do not invent specifics that are not in the host notes; use neutral placeholders like [add detail] when something is missing.`,
    `Write the "${sectionLabel}" section of a guest guide from these host notes:\n\n${notes}`,
  );
  return out ?? notes.trim();
}

export async function rewriteInstructions(text: string, locale: Locale): Promise<string> {
  const out = await complete(
    `Rewrite the text to be clearer and friendlier for a guest. Keep all codes, names and URLs exactly. Write in ${localeName(locale)}.`,
    text,
  );
  return out ?? text;
}

export async function translateContent(params: {
  text: string;
  to: Locale;
  glossary?: string[];
}): Promise<string> {
  const { text, to, glossary } = params;
  const out = await complete(
    `Translate the user's content into ${localeName(to)}. Preserve markdown/formatting, URLs, codes, numbers, and these house-specific terms verbatim: ${(glossary ?? []).join(", ") || "(none)"}. Output ONLY the translation.`,
    text,
    0.2,
  );
  return out ?? text;
}

export async function suggestFaqs(questions: string[]): Promise<string[]> {
  const out = await complete(
    `Given a list of guest questions, propose up to 5 concise FAQ topics that recur. Return one topic per line, no numbering.`,
    questions.join("\n"),
  );
  if (!out) {
    // Fallback: return the most frequent question stems.
    const seen = new Map<string, number>();
    for (const q of questions) {
      const key = q.trim().toLowerCase().slice(0, 60);
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }
  return out
    .split("\n")
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function summarizeIssue(text: string): Promise<string> {
  const out = await complete(
    `Summarize this guest-reported issue in one short sentence for a busy host.`,
    text,
    0.3,
  );
  return out ?? text.slice(0, 140);
}

export async function draftGuestReply(issue: string, locale: Locale): Promise<string> {
  const out = await complete(
    `Draft a calm, helpful reply to a guest about their reported problem. Apologize briefly, give a next step, and offer to help. Write in ${localeName(locale)}. The host will review before sending.`,
    issue,
  );
  return (
    out ??
    "Thank you for letting us know — we're sorry for the trouble. We're looking into it right now and will update you shortly."
  );
}

export async function draftReviewRequest(
  guestName: string,
  propertyName: string,
  locale: Locale,
): Promise<string> {
  const out = await complete(
    `Draft a short, warm review-request message. Never offer incentives or suggest a rating. Write in ${localeName(locale)}.`,
    `Guest: ${guestName || "there"}. Property: ${propertyName}.`,
  );
  return (
    out ??
    `Hi ${guestName || "there"}, thank you for staying at ${propertyName}! If you enjoyed your stay, we'd be grateful if you left a quick review. Safe travels!`
  );
}
