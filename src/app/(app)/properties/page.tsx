import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NewPropertyDialog } from "@/components/properties/new-property-dialog";
import { getT } from "@/lib/app-locale";

export const metadata: Metadata = { title: "Properties" };

export default async function PropertiesPage() {
  const ctx = await requireOrg();
  const canManage = can(ctx.role, "property:manage");
  const t = await getT();

  const properties = await db.property.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { sections: true, qrCodes: true } } },
  });

  return (
    <>
      <PageHeader title={t("props.title")} description={t("props.subtitle")}>
        {canManage && <NewPropertyDialog />}
      </PageHeader>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("props.empty.title")}
          description={t("props.empty.desc")}
          action={canManage ? <NewPropertyDialog /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/9] bg-muted">
                  {p.coverImageUrl ? (
                    <Image
                      src={p.coverImageUrl}
                      alt={p.publicName}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge variant={p.isPublished ? "success" : "secondary"}>
                      {p.isPublished ? t("common.published") : t("common.draft")}
                    </Badge>
                  </div>
                </div>
                <CardContent className="space-y-1 p-4">
                  <p className="font-medium">{p.publicName}</p>
                  {p.city && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {p.city}
                    </p>
                  )}
                  <p className="pt-1 text-xs text-muted-foreground">
                    {t("props.counts", { sections: p._count.sections, qr: p._count.qrCodes })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
