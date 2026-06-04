import type { Metadata } from "next";
import { BookOpen, Lightbulb } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import {
  TIROL_TEMPLATES,
  getTemplatesByCategory,
} from "@/components/templates/template-data";
import { TemplateCard } from "@/components/templates/template-card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Tirol Templates" };

export default async function TemplatesPage() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);

  if (!can(ctx.role, "guide:edit")) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Access denied"
        description="You do not have permission to manage guide templates."
      />
    );
  }

  const properties = await db.property.findMany({
    where: { organizationId: ctx.organization.id },
    select: { id: true, publicName: true },
    orderBy: { publicName: "asc" },
  });

  const byCategory = getTemplatesByCategory();
  const categories = Object.keys(byCategory);

  return (
    <>
      <PageHeader
        title="Tirol / DACH Templates"
        description="Ready-made content blocks for Austrian vacation rentals. Apply one to a property and then fine-tune it in the Guide Builder."
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            These are editable starting points, not final texts
          </p>
          <p className="text-sm text-muted-foreground">
            Regulations differ between municipalities. Waste collection days, Kurtaxe rates,
            quiet-hour exceptions, and parking rules must be verified against your local
            Gemeinde. Edit each section in the Guide Builder before publishing.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Templates available"
          value={TIROL_TEMPLATES.length}
          icon={BookOpen}
          hint="Tirol / DACH content blocks"
        />
        <StatCard
          label="Languages per template"
          value="2"
          hint="German (DE) + English (EN)"
        />
        <StatCard
          label="Your properties"
          value={properties.length}
          hint={properties.length === 0 ? "Create a property first" : "Ready to receive templates"}
        />
      </div>

      {/* No properties warning */}
      {properties.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No properties yet"
          description="Create at least one property before applying templates. Templates add guide sections directly to a property's Guide Builder."
          action={
            <a
              href="/properties"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Properties
            </a>
          }
        />
      )}

      {/* Template grid by category */}
      {properties.length > 0 && (
        <div className="space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <div className="mb-4">
                <h2 className="text-base font-semibold">{category}</h2>
                <Separator className="mt-2" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory[category].map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    properties={properties}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
