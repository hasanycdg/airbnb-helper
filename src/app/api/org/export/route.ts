import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/org/export
 *
 * Returns a GDPR-friendly JSON export of the active organization's data:
 * organization metadata, properties (with guide sections), issues, cleaning
 * tasks, recommendations, message templates and team members.
 *
 * The response is streamed as a file download via Content-Disposition: attachment.
 */
export async function GET(): Promise<NextResponse> {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;

  const [org, properties, issues, cleaningTasks, recommendations, messageTemplates, members] =
    await Promise.all([
      db.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          defaultLocale: true,
          supportedLocales: true,
          createdAt: true,
        },
      }),

      db.property.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          publicName: true,
          internalName: true,
          addressLine: true,
          city: true,
          country: true,
          postalCode: true,
          timezone: true,
          checkInTime: true,
          checkOutTime: true,
          maxGuests: true,
          baseLocale: true,
          supportedLocales: true,
          hostName: true,
          hostEmail: true,
          isPublished: true,
          createdAt: true,
          sections: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              type: true,
              slug: true,
              title: true,
              shortDescription: true,
              content: true,
              icon: true,
              order: true,
              isVisible: true,
              createdAt: true,
            },
          },
        },
      }),

      db.issue.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          urgency: true,
          status: true,
          source: true,
          description: true,
          roomLocation: true,
          resolvedAt: true,
          createdAt: true,
          property: { select: { name: true } },
        },
      }),

      db.cleaningTask.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          completedAt: true,
          notes: true,
          createdAt: true,
          property: { select: { name: true } },
        },
      }),

      db.recommendation.findMany({
        where: { property: { organizationId: orgId } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          address: true,
          website: true,
          phone: true,
          isVisible: true,
          createdAt: true,
          property: { select: { name: true } },
        },
      }),

      db.messageTemplate.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          name: true,
          locale: true,
          subject: true,
          body: true,
          channel: true,
          enabled: true,
          createdAt: true,
        },
      }),

      db.organizationMember.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: ctx.user.email,
    organization: org,
    properties,
    issues,
    cleaningTasks,
    recommendations,
    messageTemplates,
    members,
  };

  const filename = `stayguide-export-${org?.slug ?? orgId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
