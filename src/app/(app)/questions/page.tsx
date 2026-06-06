import type { Metadata } from "next";
import {
  CheckCircle2,
  MessageCircleQuestion,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuestionRow } from "@/components/questions/question-row";
import { FaqSuggestionsPanel } from "@/components/questions/faq-suggestions-panel";

export const metadata: Metadata = { title: "Guest Questions" };

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;
  const { tab } = await searchParams;
  const activeTab = tab ?? "all";

  // ── Fetch all questions across the org ────────────────────────────────────
  const questions = await db.guestQuestion.findMany({
    where: { property: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      property: { select: { id: true, publicName: true } },
      matchedSection: { select: { title: true } },
    },
  });

  // ── Stat counts ───────────────────────────────────────────────────────────
  const total = questions.length;
  const answered = questions.filter((q) => q.answered).length;
  const unanswered = questions.filter((q) => !q.answered).length;
  const escalated = questions.filter((q) => q.escalated).length;

  // ── Filter questions by tab ────────────────────────────────────────────────
  const filtered = (() => {
    if (activeTab === "unanswered") return questions.filter((q) => !q.answered);
    if (activeTab === "escalated") return questions.filter((q) => q.escalated);
    return questions;
  })();

  // ── Org properties for the FAQ creation picker ────────────────────────────
  const orgProperties = await db.property.findMany({
    where: { organizationId: orgId },
    select: { id: true, publicName: true },
    orderBy: { name: "asc" },
  });
  const defaultPropertyId = orgProperties[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title="Guest Questions"
        description="All AI-handled questions from guests across your properties."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total questions"
          value={total}
          icon={MessageCircleQuestion}
        />
        <StatCard
          label="Answered"
          value={answered}
          icon={CheckCircle2}
          hint="Resolved by AI or host"
        />
        <StatCard
          label="Unanswered"
          value={unanswered}
          icon={Inbox}
          hint="Pending host review"
        />
        <StatCard
          label="Escalated"
          value={escalated}
          icon={AlertTriangle}
          hint="Require host follow-up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Question list — 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={activeTab}>
            <TabsList>
              <TabsTrigger value="all">
                All
                {total > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                    {total}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unanswered">
                Unanswered
                {unanswered > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                    {unanswered}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="escalated">
                Escalated
                {escalated > 0 && (
                  <span className="ml-1.5 rounded-full bg-destructive/20 px-1.5 py-0.5 text-xs tabular-nums text-destructive">
                    {escalated}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {filtered.length === 0 && activeTab === "all" ? (
                <EmptyState
                  icon={MessageCircleQuestion}
                  title="No questions yet"
                  description="Guest questions from your AI assistant will appear here once guests start using their guides."
                />
              ) : (
                filtered.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    orgProperties={orgProperties}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="unanswered" className="mt-4 space-y-3">
              {unanswered === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="All questions answered"
                  description="Great work! There are no unanswered questions right now."
                />
              ) : (
                questions
                  .filter((q) => !q.answered)
                  .map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      orgProperties={orgProperties}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="escalated" className="mt-4 space-y-3">
              {escalated === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="No escalated questions"
                  description="Questions that need personal follow-up will appear here."
                />
              ) : (
                questions
                  .filter((q) => q.escalated)
                  .map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      orgProperties={orgProperties}
                    />
                  ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* FAQ suggestions panel — 1/3 width on large screens */}
        {orgProperties.length > 0 && (
          <div className="lg:col-span-1">
            <FaqSuggestionsPanel
              initialSuggestions={[]}
              orgProperties={orgProperties}
              defaultPropertyId={defaultPropertyId}
            />
          </div>
        )}
      </div>
    </>
  );
}
