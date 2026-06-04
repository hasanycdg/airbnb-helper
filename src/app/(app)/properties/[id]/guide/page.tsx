import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteSectionAction,
  reorderSectionAction,
  toggleSectionVisibilityAction,
} from "@/server/guide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionIcon } from "@/components/shared/section-icon";
import { AddSectionDialog } from "@/components/guide/add-section-dialog";
import { BookOpen } from "lucide-react";

export default async function GuideBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrg();
  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true },
  });
  if (!property) notFound();

  const sections = await db.guideSection.findMany({
    where: { propertyId: id },
    orderBy: { order: "asc" },
    include: { _count: { select: { media: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Guide builder</h2>
          <p className="text-sm text-muted-foreground">
            Reorder, hide, or edit the sections guests see. Drag-free reordering with the arrows.
          </p>
        </div>
        <AddSectionDialog propertyId={id} />
      </div>

      {sections.length === 0 ? (
        <EmptyState icon={BookOpen} title="No sections yet" description="Add your first section to start." />
      ) : (
        <div className="space-y-2">
          {sections.map((section, i) => (
            <Card key={section.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <form action={reorderSectionAction}>
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button type="submit" variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                </form>
                <form action={reorderSectionAction}>
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={i === sections.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <SectionIcon name={section.icon} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{section.title}</p>
                  {!section.isVisible && <Badge variant="secondary">Hidden</Badge>}
                  {!section.content && <Badge variant="warning">Empty</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  /{section.slug}
                  {section._count.media > 0 ? ` · ${section._count.media} media` : ""}
                </p>
              </div>

              <form action={toggleSectionVisibilityAction}>
                <input type="hidden" name="sectionId" value={section.id} />
                <Button type="submit" variant="ghost" size="icon" title={section.isVisible ? "Hide" : "Show"}>
                  {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </form>

              <Button variant="ghost" size="icon" asChild title="Edit">
                <Link href={`/properties/${id}/guide/${section.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>

              <form action={deleteSectionAction}>
                <input type="hidden" name="sectionId" value={section.id} />
                <Button type="submit" variant="ghost" size="icon" className="text-destructive" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
