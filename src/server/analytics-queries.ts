import { db } from "@/lib/db";
import { ISSUE_CATEGORY_LABELS, LOCALE_LABELS } from "@/lib/constants";
import type { IssueCategory, Locale } from "@prisma/client";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Date that is `days` days before now (UTC midnight). */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** ISO date string YYYY-MM-DD from a Date. */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Build a zero-filled daily bucket map for the last `days` days. */
function emptyDailyBuckets(days: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    map.set(toDateKey(d), 0);
  }
  return map;
}

// ── Public types ───────────────────────────────────────────────────────────

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface LocaleUsage {
  locale: Locale;
  label: string;
  flag: string;
  count: number;
  percent: number;
}

export interface IssueCategoryCount {
  category: IssueCategory;
  label: string;
  count: number;
}

export interface PropertyStat {
  propertyId: string;
  name: string;
  guideViews: number;
  qrScans: number;
  aiQuestions: number;
  openIssues: number;
  satisfactionGood: number;
  satisfactionProblem: number;
  satisfactionRate: number | null; // 0–100 or null if no responses
}

export interface MissingTopic {
  topic: string;
  count: number;
}

export interface AnalyticsSummary {
  /** Total guide views (GUIDE_VIEW events) in the last 30 days. */
  totalGuideViews: number;
  /** Total section-level views (SECTION_VIEW events) in the last 30 days. */
  totalSectionViews: number;
  /** Total QR scans (QR_SCAN events) in the last 30 days. */
  totalQrScans: number;
  /** AI questions that were answered. */
  aiAnswered: number;
  /** AI questions that were NOT answered (escalated or answered=false). */
  aiUnanswered: number;
  /** Daily guide view counts for the bar chart (last 30 days). */
  guideViewsByDay: DailyCount[];
  /** Daily section-view counts for the bar chart (last 30 days). */
  sectionViewsByDay: DailyCount[];
  /** Guest language distribution. */
  localeUsage: LocaleUsage[];
  /** Issues by category. */
  issuesByCategory: IssueCategoryCount[];
  /** Average issue resolution time in hours (resolved issues only). */
  avgResolutionHours: number | null;
  /** Average satisfaction score: % of GOOD responses out of all non-PENDING. */
  satisfactionScore: number | null;
  /** Per-property comparison rows. */
  propertyStats: PropertyStat[];
  /** Top 5 "missing" guide topics derived from unanswered/escalated questions. */
  missingTopics: MissingTopic[];
}

// ── Main query function ────────────────────────────────────────────────────

/**
 * Fetch all analytics data for the organisation scoped to the last 30 days.
 * Called only from a Server Component — NOT a server action.
 */
export async function getAnalyticsSummary(organizationId: string): Promise<AnalyticsSummary> {
  const since = daysAgo(30);

  // Run all independent queries in parallel for speed.
  const [
    analyticsEvents,
    guideViewEvents,
    allQuestions,
    resolvedIssues,
    allIssues,
    satisfactionChecks,
    properties,
  ] = await Promise.all([
    // All analytics events for the org in the last 30 days
    db.analyticsEvent.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { type: true, propertyId: true, locale: true, createdAt: true },
    }),
    // GuestGuideViewEvent for the org (via property) in the last 30 days
    db.guestGuideViewEvent.findMany({
      where: { property: { organizationId }, createdAt: { gte: since } },
      select: { propertyId: true, locale: true, createdAt: true },
    }),
    // All guest questions for the org (no date filter — we want topic analysis too)
    db.guestQuestion.findMany({
      where: { property: { organizationId } },
      select: {
        answered: true,
        escalated: true,
        question: true,
        locale: true,
        createdAt: true,
        propertyId: true,
      },
    }),
    // Resolved issues for avg resolution time
    db.issue.findMany({
      where: {
        organizationId,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { not: null },
        createdAt: { gte: since },
      },
      select: { createdAt: true, resolvedAt: true },
    }),
    // All issues (any status) in the last 30 days for category breakdown
    db.issue.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { category: true, status: true, propertyId: true },
    }),
    // Satisfaction checks responded in the last 30 days
    db.satisfactionCheck.findMany({
      where: {
        property: { organizationId },
        status: { not: "PENDING" },
        respondedAt: { gte: since },
      },
      select: { status: true, propertyId: true },
    }),
    // Properties for the property comparison table
    db.property.findMany({
      where: { organizationId },
      select: { id: true, publicName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // ── Guide views & section views by day ────────────────────────────────────
  const guideViewBuckets = emptyDailyBuckets(30);
  const sectionViewBuckets = emptyDailyBuckets(30);

  for (const ev of analyticsEvents) {
    const key = toDateKey(ev.createdAt);
    if (ev.type === "GUIDE_VIEW" && guideViewBuckets.has(key)) {
      guideViewBuckets.set(key, (guideViewBuckets.get(key) ?? 0) + 1);
    }
    if (ev.type === "SECTION_VIEW" && sectionViewBuckets.has(key)) {
      sectionViewBuckets.set(key, (sectionViewBuckets.get(key) ?? 0) + 1);
    }
  }

  const guideViewsByDay: DailyCount[] = Array.from(guideViewBuckets.entries()).map(
    ([date, count]) => ({ date, count }),
  );
  const sectionViewsByDay: DailyCount[] = Array.from(sectionViewBuckets.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const totalGuideViews = analyticsEvents.filter((e) => e.type === "GUIDE_VIEW").length;
  const totalSectionViews = analyticsEvents.filter((e) => e.type === "SECTION_VIEW").length;
  const totalQrScans = analyticsEvents.filter((e) => e.type === "QR_SCAN").length;

  const recentQuestions = allQuestions.filter((q) => q.createdAt >= since);
  const aiAnswered = recentQuestions.filter((q) => q.answered).length;
  const aiUnanswered = recentQuestions.filter((q) => !q.answered).length;

  // ── Locale usage (from analytics events that have a locale) ───────────────
  const localeCounts = new Map<Locale, number>();
  for (const ev of analyticsEvents) {
    if (ev.locale) {
      localeCounts.set(ev.locale, (localeCounts.get(ev.locale) ?? 0) + 1);
    }
  }
  // Supplement with guide view events' locale data
  for (const ev of guideViewEvents) {
    if (ev.locale) {
      localeCounts.set(ev.locale, (localeCounts.get(ev.locale) ?? 0) + 1);
    }
  }
  const totalLocaleEvents = Array.from(localeCounts.values()).reduce((a, b) => a + b, 0);
  const localeUsage: LocaleUsage[] = Array.from(localeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([locale, count]) => ({
      locale,
      label: LOCALE_LABELS[locale].name,
      flag: LOCALE_LABELS[locale].flag,
      count,
      percent: totalLocaleEvents > 0 ? Math.round((count / totalLocaleEvents) * 100) : 0,
    }));

  // ── Issues by category ────────────────────────────────────────────────────
  const categoryCounts = new Map<IssueCategory, number>();
  for (const issue of allIssues) {
    categoryCounts.set(issue.category, (categoryCounts.get(issue.category) ?? 0) + 1);
  }
  const issuesByCategory: IssueCategoryCount[] = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: ISSUE_CATEGORY_LABELS[category],
      count,
    }));

  // ── Average resolution time ───────────────────────────────────────────────
  let avgResolutionHours: number | null = null;
  if (resolvedIssues.length > 0) {
    const totalMs = resolvedIssues.reduce((sum, issue) => {
      const resolved = issue.resolvedAt!;
      return sum + (resolved.getTime() - issue.createdAt.getTime());
    }, 0);
    avgResolutionHours = Math.round(totalMs / resolvedIssues.length / 1000 / 3600);
  }

  // ── Satisfaction score ────────────────────────────────────────────────────
  let satisfactionScore: number | null = null;
  if (satisfactionChecks.length > 0) {
    const goodCount = satisfactionChecks.filter((s) => s.status === "GOOD").length;
    satisfactionScore = Math.round((goodCount / satisfactionChecks.length) * 100);
  }

  // ── Property comparison ───────────────────────────────────────────────────
  const propertyStats: PropertyStat[] = properties.map((p) => {
    const pGuideViews = analyticsEvents.filter(
      (e) => e.propertyId === p.id && e.type === "GUIDE_VIEW",
    ).length;
    const pQrScans = analyticsEvents.filter(
      (e) => e.propertyId === p.id && e.type === "QR_SCAN",
    ).length;
    const pAiQuestions = recentQuestions.filter((q) => q.propertyId === p.id).length;
    const pOpenIssues = allIssues.filter(
      (i) => i.propertyId === p.id && !["RESOLVED", "CLOSED"].includes(i.status),
    ).length;
    const pSatChecks = satisfactionChecks.filter((s) => s.propertyId === p.id);
    const pGood = pSatChecks.filter((s) => s.status === "GOOD").length;
    const pProblem = pSatChecks.filter((s) => s.status === "PROBLEM").length;
    const pSatRate =
      pSatChecks.length > 0 ? Math.round((pGood / pSatChecks.length) * 100) : null;

    return {
      propertyId: p.id,
      name: p.publicName,
      guideViews: pGuideViews,
      qrScans: pQrScans,
      aiQuestions: pAiQuestions,
      openIssues: pOpenIssues,
      satisfactionGood: pGood,
      satisfactionProblem: pProblem,
      satisfactionRate: pSatRate,
    };
  });

  // ── Missing topics (from unanswered/escalated questions) ─────────────────
  const topicFreq = new Map<string, number>();
  const unansweredOrEscalated = allQuestions.filter((q) => !q.answered || q.escalated);
  for (const q of unansweredOrEscalated) {
    // Extract 2–4 word noun phrases as rough topic signals.
    // Simple heuristic: lowercase words longer than 4 chars that aren't stop-words.
    const stopWords = new Set([
      "what", "where", "when", "which", "does", "have", "from", "with",
      "this", "that", "there", "their", "about", "would", "could", "should",
      "will", "your", "please", "hello", "thank", "thanks", "help",
      "property", "apartment", "house", "place",
    ]);
    const words = q.question
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !stopWords.has(w));
    for (const w of words) {
      topicFreq.set(w, (topicFreq.get(w) ?? 0) + 1);
    }
  }
  const missingTopics: MissingTopic[] = Array.from(topicFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      count,
    }));

  return {
    totalGuideViews,
    totalSectionViews,
    totalQrScans,
    aiAnswered,
    aiUnanswered,
    guideViewsByDay,
    sectionViewsByDay,
    localeUsage,
    issuesByCategory,
    avgResolutionHours,
    satisfactionScore,
    propertyStats,
    missingTopics,
  };
}
