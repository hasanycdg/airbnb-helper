import type { Metadata } from "next";
import {
  BarChart2,
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  HelpCircle,
  QrCode,
  Smile,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart } from "@/components/analytics/bar-chart";
import { StatRow } from "@/components/analytics/stat-row";
import { PrintButton } from "@/components/analytics/print-button";
import { getAnalyticsSummary } from "@/server/analytics-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
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

  const orgId = ctx.organization.id;
  const data = await getAnalyticsSummary(orgId);

  // Prepare bar chart data — short "MMM DD" labels
  const guideChartData = data.guideViewsByDay.map((d) => ({
    label: d.date,
    value: d.count,
  }));
  const sectionChartData = data.sectionViewsByDay.map((d) => ({
    label: d.date,
    value: d.count,
  }));

  const hasAnyData =
    data.totalGuideViews > 0 ||
    data.totalQrScans > 0 ||
    data.aiAnswered + data.aiUnanswered > 0;

  const totalAiQuestions = data.aiAnswered + data.aiUnanswered;
  const aiAnswerRate =
    totalAiQuestions > 0 ? Math.round((data.aiAnswered / totalAiQuestions) * 100) : null;

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Analytics"
        description="Last 30 days · All properties"
        className="print:hidden"
      >
        <PrintButton />
      </PageHeader>

      {/* Print-only title */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">{ctx.organization.name} — Monthly Analytics Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 30 days · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Analytics will appear once guests start viewing your guides, scanning QR codes, or asking questions."
          className="mt-8"
        />
      ) : (
        <>
          {/* ── Top KPI stat cards ──────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Guide views"
              value={data.totalGuideViews}
              icon={BarChart2}
              hint="Full guide opens"
            />
            <StatCard
              label="Section views"
              value={data.totalSectionViews}
              icon={TrendingUp}
              hint="Individual section opens"
            />
            <StatCard
              label="QR scans"
              value={data.totalQrScans}
              icon={QrCode}
              hint="All QR code scans"
            />
            <StatCard
              label="Satisfaction"
              value={data.satisfactionScore !== null ? `${data.satisfactionScore}%` : "—"}
              icon={Smile}
              hint={data.satisfactionScore !== null ? "Good responses" : "No responses yet"}
            />
          </div>

          {/* ── Guide views over time ───────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Guide views — last 30 days
                </CardTitle>
                <CardDescription>
                  Daily count of full guide opens across all properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart data={guideChartData} maxBarHeight={100} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Section views — last 30 days
                </CardTitle>
                <CardDescription>
                  Daily count of individual section views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={sectionChartData}
                  maxBarHeight={100}
                  barColor="bg-blue-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* ── AI questions + satisfaction ─────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI assistant stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" />
                  AI assistant
                </CardTitle>
                <CardDescription>Guest questions handled by the AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow
                  items={[
                    { label: "Answered by AI", value: data.aiAnswered, badgeColor: "text-green-600 dark:text-green-400" },
                    { label: "Unanswered", value: data.aiUnanswered, badgeColor: "text-destructive" },
                    {
                      label: "Answer rate",
                      value: aiAnswerRate !== null ? `${aiAnswerRate}%` : "—",
                    },
                  ]}
                />
                {aiAnswerRate !== null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Answer rate</span>
                      <span>{aiAnswerRate}%</span>
                    </div>
                    <Progress value={aiAnswerRate} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smile className="h-4 w-4 text-primary" />
                  Guest satisfaction
                </CardTitle>
                <CardDescription>Satisfaction check responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.satisfactionScore === null ? (
                  <p className="text-sm text-muted-foreground">
                    No satisfaction check responses in the last 30 days.
                  </p>
                ) : (
                  <>
                    <StatRow
                      items={[
                        { label: "Score", value: `${data.satisfactionScore}%`, badgeColor: data.satisfactionScore >= 75 ? "text-green-600 dark:text-green-400" : "text-warning" },
                        { label: "Avg. resolution", value: data.avgResolutionHours !== null ? `${data.avgResolutionHours}h` : "—", hint: "for resolved issues" },
                      ]}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Satisfaction score</span>
                        <span>{data.satisfactionScore}%</span>
                      </div>
                      <Progress
                        value={data.satisfactionScore}
                        className={cn(
                          "h-2",
                          data.satisfactionScore >= 75
                            ? "[&>div]:bg-green-500"
                            : "[&>div]:bg-warning",
                        )}
                      />
                    </div>
                  </>
                )}
                {data.avgResolutionHours !== null && data.satisfactionScore === null && (
                  <StatRow
                    items={[
                      {
                        label: "Avg. resolution time",
                        value: `${data.avgResolutionHours}h`,
                        hint: "for resolved issues",
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Guest language usage ─────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Guest languages
                </CardTitle>
                <CardDescription>Locale distribution from guide views</CardDescription>
              </CardHeader>
              <CardContent>
                {data.localeUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locale data available yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.localeUsage.map((l) => (
                      <li key={l.locale} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span>{l.flag}</span>
                            <span className="font-medium">{l.label}</span>
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {l.count} ({l.percent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${l.percent}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Issues by category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TriangleAlert className="h-4 w-4 text-primary" />
                  Issues by category
                </CardTitle>
                <CardDescription>Distribution across all issue types</CardDescription>
              </CardHeader>
              <CardContent>
                {data.issuesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No issues recorded in the last 30 days.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.issuesByCategory.slice(0, 8).map((item) => {
                      const max = data.issuesByCategory[0].count;
                      const pct = Math.round((item.count / max) * 100);
                      return (
                        <li key={item.category} className="flex items-center gap-3 text-sm">
                          <span className="w-36 shrink-0 truncate font-medium">{item.label}</span>
                          <div className="flex flex-1 items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-destructive/70 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Resolution time + missing topics ─────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Average resolution time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Issue resolution time
                </CardTitle>
                <CardDescription>Average hours from creation to resolution</CardDescription>
              </CardHeader>
              <CardContent>
                {data.avgResolutionHours === null ? (
                  <p className="text-sm text-muted-foreground">
                    No resolved issues in the last 30 days.
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold tabular-nums">
                      {data.avgResolutionHours}
                    </span>
                    <span className="mb-1 text-muted-foreground">hours avg</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 5 missing guide topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Top missing guide topics
                </CardTitle>
                <CardDescription>
                  Recurring themes from unanswered / escalated questions — add these to your guide
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.missingTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No unanswered questions to analyse yet.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {data.missingTopics.map((t, i) => (
                      <li key={t.topic} className="flex items-center gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="flex-1 font-medium">{t.topic}</span>
                        <Badge variant="secondary" className="tabular-nums">
                          {t.count} {t.count === 1 ? "question" : "questions"}
                        </Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Property comparison table ─────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4 text-primary" />
                Property comparison
              </CardTitle>
              <CardDescription>Side-by-side metrics across all your properties</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.propertyStats.length === 0 ? (
                <div className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground">No properties found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="text-right">Guide views</TableHead>
                        <TableHead className="text-right">QR scans</TableHead>
                        <TableHead className="text-right">AI questions</TableHead>
                        <TableHead className="text-right">Open issues</TableHead>
                        <TableHead className="text-right">Satisfaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.propertyStats.map((p) => (
                        <TableRow key={p.propertyId}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.guideViews}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.qrScans}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.aiQuestions}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.openIssues > 0 ? (
                              <span className="text-destructive font-medium">{p.openIssues}</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-3 w-3" />0
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.satisfactionRate !== null ? (
                              <span
                                className={cn(
                                  "font-medium",
                                  p.satisfactionRate >= 75
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-warning",
                                )}
                              >
                                {p.satisfactionRate}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Print-only styles ────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          nav, aside, [data-sidebar], .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .rounded-xl { border-radius: 0 !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
