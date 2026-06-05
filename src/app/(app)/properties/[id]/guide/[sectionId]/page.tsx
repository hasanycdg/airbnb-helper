import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadTranslations } from "@/lib/i18n";
import { LOCALE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionEditor } from "@/components/guide/section-editor";

export default async function SectionEditorPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id, sectionId } = await params;
  const ctx = await requireOrg();

  const section = await db.guideSection.findFirst({
    where: { id: sectionId, propertyId: id, property: { organizationId: ctx.organization.id } },
    include: {
      property: { select: { baseLocale: true, supportedLocales: true } },
      media: { select: { id: true, title: true, type: true, thumbnailUrl: true } },
    },
  });
  if (!section) notFound();

  const tmap = (await loadTranslations("GuideSection", [sectionId]))[sectionId] ?? {};
  const baseLocale = section.property.baseLocale;
  const otherLocales = section.property.supportedLocales.filter((l) => l !== baseLocale);
  const initialTranslations = Object.fromEntries(
    otherLocales.map((loc) => [
      loc,
      { title: tmap.title?.[loc] ?? "", content: tmap.content?.[loc] ?? "" },
    ]),
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/properties/${id}/guide`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to guide builder
      </Link>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{section.title}</h2>
        <Badge variant="outline">{LOCALE_LABELS[baseLocale].flag} base language</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <SectionEditor
          section={section}
          otherLocales={otherLocales}
          initialTranslations={initialTranslations}
        />

        <div className="space-y-4">
          {section.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-4 w-4" /> Attached media
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {section.media.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                      {m.thumbnailUrl && (
                        <Image src={m.thumbnailUrl} alt={m.title ?? ""} fill className="object-cover" />
                      )}
                    </div>
                    <p className="truncate text-xs">{m.title ?? m.type}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {otherLocales.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Add more guest languages in the property settings to translate this section.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
