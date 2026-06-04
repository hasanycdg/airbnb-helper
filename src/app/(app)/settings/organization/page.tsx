import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { OrgSettingsForm } from "@/components/org/org-settings-form";
import { DeleteOrgDialog } from "@/components/org/delete-org-dialog";
import { ExportDataButton } from "@/components/org/export-data-button";

export const metadata = { title: "Organization settings — StayGuide Pro" };

export default async function OrganizationSettingsPage() {
  // org:manage is OWNER-only per the RBAC matrix
  const ctx = await requireRole(["OWNER"]);
  const { organization, role } = ctx;

  const canManage = can(role, "org:manage");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization settings"
        description="Manage your organization's name, branding and supported languages."
      >
        <ExportDataButton />
      </PageHeader>

      {canManage ? (
        <OrgSettingsForm
          organization={{
            name: organization.name,
            primaryColor: organization.primaryColor,
            logoUrl: organization.logoUrl,
            defaultLocale: organization.defaultLocale,
            supportedLocales: organization.supportedLocales,
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          You do not have permission to edit organization settings.
        </p>
      )}

      <Separator />

      {/* GDPR / Data section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Data &amp; privacy</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Export your data</CardTitle>
            <CardDescription>
              Under GDPR Art. 20 (right to data portability) you can download a full copy of your
              organization's data — including properties, guide sections, issues, cleaning tasks,
              recommendations, message templates and team members — as a machine-readable JSON file.
              The export does not include guest personal data stored by third-party booking
              platforms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportDataButton />
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Danger zone */}
      {canManage && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-destructive">Danger zone</h2>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Delete organization</CardTitle>
              <CardDescription>
                Permanently deletes <span className="font-semibold">{organization.name}</span> and
                all associated data: properties, guide content, issues, cleaning records, analytics,
                team members and billing. This is irreversible and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteOrgDialog orgName={organization.name} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
