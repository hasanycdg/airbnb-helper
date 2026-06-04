import type { Metadata } from "next";
import { Mail, Info } from "lucide-react";
import type { MessageType } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { MESSAGE_TYPE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateGroup } from "@/components/messages/template-group";
import { TemplateFormDialog } from "@/components/messages/template-form-dialog";

export const metadata: Metadata = { title: "Message Templates" };

export default async function MessagesPage() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const [templates, properties] = await Promise.all([
    db.messageTemplate.findMany({
      where: { organizationId: orgId },
      orderBy: [{ type: "asc" }, { locale: "asc" }, { name: "asc" }],
      include: { property: { select: { publicName: true } } },
    }),
    db.property.findMany({
      where: { organizationId: orgId },
      select: { id: true, publicName: true },
      orderBy: { publicName: "asc" },
    }),
  ]);

  // Group templates by MessageType preserving label order.
  const messageTypeOrder = Object.keys(MESSAGE_TYPE_LABELS) as MessageType[];

  type TemplateWithProperty = (typeof templates)[number];

  const grouped = messageTypeOrder
    .map((type) => ({
      type,
      label: MESSAGE_TYPE_LABELS[type],
      templates: templates.filter((t) => t.type === type) as TemplateWithProperty[],
    }))
    .filter((g) => g.templates.length > 0);

  // Stats
  const totalCount = templates.length;
  const enabledCount = templates.filter((t) => t.enabled).length;
  const orgWideCount = templates.filter((t) => t.propertyId === null).length;
  const perPropertyCount = templates.filter((t) => t.propertyId !== null).length;

  // Props for client components — strip full Prisma types to plain objects.
  const plainProperties = properties.map((p) => ({ id: p.id, publicName: p.publicName }));

  return (
    <>
      <PageHeader
        title="Message Templates"
        description="Create and manage reusable guest message templates. Preview and copy rendered messages, or enable automated delivery once guest contact details are stored."
      >
        <TemplateFormDialog mode="create" properties={plainProperties} />
      </PageHeader>

      {/* Stats row */}
      {totalCount > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total templates" value={totalCount} icon={Mail} />
          <StatCard
            label="Enabled"
            value={enabledCount}
            hint={`${totalCount - enabledCount} disabled`}
          />
          <StatCard label="Org-wide" value={orgWideCount} hint="Apply to all properties" />
          <StatCard label="Per property" value={perPropertyCount} hint="Property-specific overrides" />
        </div>
      )}

      {/* Info banner: automated sending note */}
      <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-blue-800 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>v1 — copy &amp; preview mode.</strong> Use the Preview button to render a
            template with demo data and copy it to your clipboard. Automated scheduled sending
            activates once guest contact details (email / phone) are stored on a booking stay.
          </span>
        </CardContent>
      </Card>

      {/* Template list grouped by type */}
      {templates.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No message templates yet"
          description="Create reusable templates for booking confirmations, pre-arrival messages, checkout reminders, and more."
          action={<TemplateFormDialog mode="create" properties={plainProperties} />}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <TemplateGroup
              key={group.type}
              label={group.label}
              templates={group.templates.map((t) => ({
                id: t.id,
                name: t.name,
                type: t.type,
                locale: t.locale,
                channel: t.channel,
                subject: t.subject,
                body: t.body,
                enabled: t.enabled,
                propertyId: t.propertyId,
                property: t.property,
              }))}
              properties={plainProperties}
            />
          ))}
        </div>
      )}
    </>
  );
}
