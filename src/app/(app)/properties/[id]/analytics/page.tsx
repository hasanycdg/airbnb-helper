import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BarChart2,
  Bot,
  Globe,
  QrCode,
  Smile,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import type { IssueCategory, Locale } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ISSUE_CATEGORY_LABELS, LOCALE_LABELS, QR_CODE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewsBarChart } from "@/components/property-analytics/views-bar-chart";
import { SectionViewsList } from "@/components/property-analytics/section-views-list";
import { QRScansList } from "@/components/property-analytics/qr-scans-list";
import { AIQuestionsDonut } from "@/components/property-analytics/ai-questions-donut";
import { LocaleBars } from "@/components/property-analytics/locale-bars";
import { IssuesByCategory } from "@/components/property-analytics/issues-by-category";
import { SatisfactionGauge } from "@/components/property-analytics/satisfaction-gauge";

export const metadata: Metadata = { title: "Property Analytics" };

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PropertyAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth — OWNER or MANAGER with analytics:view permission
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  if (!can(ctx.role, "analytics:view")) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Analytics not available"
        description="Your role does not have access to analytics."
      />
    );
  }

  // Org-scope: confirm this property belongs to the active org
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true, publicName: true, name: true },
  });
  if (!property) notFound();

  const since = daysAgo(30);
  const orgId = ctx.organization.id;
  const propertyId = property.id;

  // Run all queries in parallel — all scoped to this property + org
  const [
    analyticsEvents,
    guideViewEvents,
    guestQuestions,
    qrCodes,
    sections,
    sectionViewEvents,
    resolvedIssues,
    allIssues,
    satisfactionChecks,
  ] = await Promise.all([
    // Analytics events for this property
    db.analyticsEvent.findMany({
      where: { organizationId: orgId, propertyId, createdAt: { gte: since } },
      select: { type: true, locale: true, createdAt: true, sectionId: true, qrCodeId: true },
    }),
    // GuestGuideViewEvent for this property
    db.guestGuideViewEvent.findMany({
      where: { propertyId, property: { organizationId: orgId }, createdAt: { gte: since } },
      select: { locale: true, createdAt: true, sectionId: true },
    }),
    // Guest questions for this property (30 days)
    db.guestQuestion.findMany({
      where: {
        propertyId,
        property: { organizationId: orgId },
        createdAt: { gte: since },
      },
      select: { answered: true, escalated: true, locale: true },
    }),
    // QR codes for this property
    db.qRCode.findMany({
      where: { propertyId, property: { organizationId: orgId } },
      select: { id: true, label: true, type: true, scanCount: true },
      orderBy: { scanCount: "desc" },
    }),
    // Guide sections for this property (for label lookup)
    db.guideSection.findMany({
      where: { propertyId, property: { organizationId: orgId } },
      select: { id: true, title: true },
    }),
    // Section view events (analytics) for this property
    db.analyticsEvent.findMany({
      where: {
        organizationId: orgId,
        propertyId,
        type: "SECTION_VIEW",
        createdAt: { gte: since },
        sectionId: { not: null },
      },
      select: { sectionId: true },
    }),
    // Resolved issues for avg resolution time
    db.issue.findMany({
      where: {
        propertyId,
        organizationId: orgId,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { not: null },
        createdAt: { gte: since },
      },
      select: { createdAt: true, resolvedAt: true },
    }),
    // All issues for category breakdown
    db.issue.findMany({
      where: { propertyId, organizationId: orgId, createdAt: { gte: since } },
      select: { category: true },
    }),
    // Satisfaction checks for this property
    db.satisfactionCheck.findMany({
      where: {
        propertyId,
        property: { organizationId: orgId },
        status: { not: "PENDING" },
        respondedAt: { gte: since },
      },
      select: { status: true },
    }),
  ]);

  // ── Guide views over 30 days ─────────────────────────────────────────────
  const guideViewBuckets = emptyDailyBuckets(30);

  // Count GUIDE_VIEW analytics events
  for (const ev of analyticsEvents) {
    if (ev.type === "GUIDE_VIEW") {
      const key = toDateKey(ev.createdAt);
      if (guideViewBuckets.has(key)) {
        guideViewBuckets.set(key, (guideViewBuckets.get(key) ?? 0) + 1);
      }
    }
  }
  // Supplement with GuestGuideViewEvent rows (no sectionId = full guide open)
  for (const ev of guideViewEvents) {
    if (!ev.sectionId) {
      const key = toDateKey(ev.createdAt);
      if (guideViewBuckets.has(key)) {
        guideViewBuckets.set(key, (guideViewBuckets.get(key) ?? 0) + 1);
      }
    }
  }

  const guideViewsByDay = Array.from(guideViewBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const totalGuideViews = guideViewsByDay.reduce((s, d) => s + d.count, 0);

  // ── Top viewed sections ──────────────────────────────────────────────────
  const sectionCountMap = new Map<string, number>();

  // From analytics SECTION_VIEW events
  for (const ev of sectionViewEvents) {
    if (ev.sectionId) {
      sectionCountMap.set(ev.sectionId, (sectionCountMap.get(ev.sectionId) ?? 0) + 1);
    }
  }
  // From GuestGuideViewEvent rows that target a section
  for (const ev of guideViewEvents) {
    if (ev.sectionId) {
      sectionCountMap.set(ev.sectionId, (sectionCountMap.get(ev.sectionId) ?? 0) + 1);
    }
  }

  const sectionMap = new Map(sections.map((s) => [s.id, s.title]));

  const topSections = Array.from(sectionCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([sectionId, count]) => ({
      sectionId,
      title: sectionMap.get(sectionId) ?? "Unknown section",
      count,
    }));

  const totalSectionViews = Array.from(sectionCountMap.values()).reduce((s, v) => s + v, 0);

  // ── QR scans ─────────────────────────────────────────────────────────────
  const totalQrScans = qrCodes.reduce((s, q) => s + q.scanCount, 0);

  // ── AI questions ─────────────────────────────────────────────────────────
  const aiAnswered = guestQuestions.filter((q) => q.answered).length;
  const aiUnanswered = guestQuestions.filter((q) => !q.answered).length;

  // ── Guest languages ───────────────────────────────────────────────────────
  const localeCounts = new Map<Locale, number>();
  for (const ev of analyticsEvents) {
    if (ev.locale) {
      localeCounts.set(ev.locale, (localeCounts.get(ev.locale) ?? 0) + 1);
    }
  }
  for (const ev of guideViewEvents) {
    if (ev.locale) {
      localeCounts.set(ev.locale, (localeCounts.get(ev.locale) ?? 0) + 1);
    }
  }
  for (const q of guestQuestions) {
    if (q.locale) {
      localeCounts.set(q.locale, (localeCounts.get(q.locale) ?? 0) + 1);
    }
  }
  const totalLocaleEvents = Array.from(localeCounts.values()).reduce((a, b) => a + b, 0);
  const localeUsage = Array.from(localeCounts.entries())
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
  const issuesByCategory = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: ISSUE_CATEGORY_LABELS[category],
      count,
    }));

  // ── Satisfaction score ────────────────────────────────────────────────────
  const satGood = satisfactionChecks.filter((s) => s.status === "GOOD").length;
  const satProblem = satisfactionChecks.filter((s) => s.status === "PROBLEM").length;
  const satisfactionScore =
    satisfactionChecks.length > 0
      ? Math.round((satGood / satisfactionChecks.length) * 100)
      : null;

  // ── Avg resolution time ───────────────────────────────────────────────────
  let avgResolutionHours: number | null = null;
  if (resolvedIssues.length > 0) {
    const totalMs = resolvedIssues.reduce((sum, issue) => {
      return sum + (issue.resolvedAt!.getTime() - issue.createdAt.getTime());
    }, 0);
    avgResolutionHours = Math.round(totalMs / resolvedIssues.length / 1000 / 3600);
  }

  const hasAnyData =
    totalGuideViews > 0 ||
    totalQrScans > 0 ||
    guestQuestions.length > 0 ||
    allIssues.length > 0 ||
    satisfactionChecks.length > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Last 30 days · ${property.publicName}`}
      />

      {!hasAnyData ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Analytics will appear once guests start viewing the guide, scanning QR codes, or asking questions."
          className="mt-8"
        />
      ) : (
        <>
          {/* ── KPI stat cards ─────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Guide views"
              value={totalGuideViews}
              icon={BarChart2}
              hint="Full guide opens"
            />
            <StatCard
              label="Section views"
              value={totalSectionViews}
              icon={TrendingUp}
              hint="Individual section opens"
            />
            <StatCard
              label="QR scans"
              value={totalQrScans}
              icon={QrCode}
              hint="Total scans across all codes"
            />
            <StatCard
              label="Satisfaction"
              value={satisfactionScore !== null ? `${satisfactionScore}%` : "—"}
              icon={Smile}
              hint={satisfactionScore !== null ? "Good responses" : "No responses yet"}
            />
          </div>

          {/* ── Guide views chart ──────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4 text-primary" />
                Guide views — last 30 days
              </CardTitle>
              <CardDescription>Daily count of full guide opens</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewsBarChart data={guideViewsByDay} maxBarHeight={110} />
            </CardContent>
          </Card>

          {/* ── Section views + QR scans ──────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Top viewed sections
                </CardTitle>
                <CardDescription>Most opened guide sections in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <SectionViewsList items={topSections} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4 text-primary" />
                  QR scans per code
                </CardTitle>
                <CardDescription>Cumulative scans for each QR code</CardDescription>
              </CardHeader>
              <CardContent>
                <QRScansList
                  items={qrCodes.map((q) => ({
                    id: q.id,
                    label: q.label,
                    type: q.type,
                    scanCount: q.scanCount,
                  }))}
                  qrTypeLabels={QR_CODE_LABELS}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── AI questions + guest languages ─────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" />
                  AI questions answered
                </CardTitle>
                <CardDescription>
                  Guest questions handled by the AI assistant in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIQuestionsDonut answered={aiAnswered} unanswered={aiUnanswered} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Guest languages
                </CardTitle>
                <CardDescription>Locale distribution from guide views & questions</CardDescription>
              </CardHeader>
              <CardContent>
                <LocaleBars items={localeUsage} />
              </CardContent>
            </Card>
          </div>

          {/* ── Issues by category + satisfaction ─────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TriangleAlert className="h-4 w-4 text-primary" />
                  Issues by category
                </CardTitle>
                <CardDescription>Issue distribution in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <IssuesByCategory items={issuesByCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smile className="h-4 w-4 text-primary" />
                  Guest satisfaction
                </CardTitle>
                <CardDescription>
                  Satisfaction check responses in the last 30 days
                  {avgResolutionHours !== null && (
                    <> · avg. resolution <strong>{avgResolutionHours}h</strong></>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SatisfactionGauge
                  score={satisfactionScore}
                  good={satGood}
                  problem={satProblem}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
