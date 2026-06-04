import { notFound } from "next/navigation";
import { MessageCircleQuestion, MessageCircleX, PhoneForwarded } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { planHasCapability, PLANS } from "@/lib/plans";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AiSettingsForm } from "@/components/ai-settings/ai-settings-form";
import { AiTestConsole } from "@/components/ai-settings/ai-test-console";

export default async function AiAssistantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  // Org-scoped property load.
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: {
      id: true,
      slug: true,
      publicName: true,
      aiEnabled: true,
      aiConfidenceThreshold: true,
      aiSystemPromptExtra: true,
    },
  });
  if (!property) notFound();

  // Plan capability check.
  const planTier = ctx.organization.subscription?.plan ?? "TRIAL";
  const hasAiCapability = planHasCapability(planTier, "aiAssistant");
  const planName = PLANS[planTier].name;

  // Question stats for this property.
  const [answered, unanswered, escalated] = await Promise.all([
    db.guestQuestion.count({
      where: { propertyId: id, answered: true },
    }),
    db.guestQuestion.count({
      where: { propertyId: id, answered: false, escalated: false },
    }),
    db.guestQuestion.count({
      where: { propertyId: id, escalated: true },
    }),
  ]);

  const total = answered + unanswered + escalated;
  const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI assistant"
        description={`Configure the guest AI assistant for ${property.publicName}. It answers questions from your approved guide content only.`}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Questions answered"
          value={answered}
          icon={MessageCircleQuestion}
          hint={total > 0 ? `${answerRate}% answer rate` : "No questions yet"}
        />
        <StatCard
          label="Unanswered"
          value={unanswered}
          icon={MessageCircleX}
          hint="Below confidence threshold"
        />
        <StatCard
          label="Escalated to host"
          value={escalated}
          icon={PhoneForwarded}
          hint="Guest referred to you directly"
        />
      </div>

      {/* Settings form */}
      <AiSettingsForm
        propertyId={property.id}
        slug={property.slug}
        aiEnabled={property.aiEnabled}
        aiConfidenceThreshold={property.aiConfidenceThreshold}
        aiSystemPromptExtra={property.aiSystemPromptExtra}
        hasAiCapability={hasAiCapability}
        planName={planName}
      />

      {/* Test console */}
      <AiTestConsole slug={property.slug} aiEnabled={property.aiEnabled} />
    </div>
  );
}
