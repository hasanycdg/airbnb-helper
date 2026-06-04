import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { PROPERTY_NAV } from "@/lib/nav";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyTabs } from "@/components/properties/property-tabs";

export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrg();

  const property = await db.property.findFirst({
    where: { id, organizationId: ctx.organization.id },
    select: { id: true, publicName: true, city: true, slug: true, isPublished: true },
  });
  if (!property) notFound();

  const tabs = PROPERTY_NAV.filter((t) => !t.permission || can(ctx.role, t.permission)).map((t) => ({
    label: t.label,
    href: `/properties/${property.id}${t.segment}`,
    icon: t.icon,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/properties" className="text-sm text-muted-foreground hover:text-foreground">
            Properties
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">{property.publicName}</h1>
          <Badge variant={property.isPublished ? "success" : "secondary"}>
            {property.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`${env.appUrl}/g/${property.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink /> View guest guide
          </a>
        </Button>
      </div>

      <PropertyTabs tabs={tabs} />
      <div className="pt-1">{children}</div>
    </div>
  );
}
