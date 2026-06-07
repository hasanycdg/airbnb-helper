import type { Metadata } from "next";
import { requireOrg } from "@/lib/auth";
import { getT } from "@/lib/app-locale";
import { supportInbox } from "@/lib/email";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportForm } from "@/components/support/support-form";

export const metadata: Metadata = { title: "Profil — StayGuide Pro" };

export default async function ProfilePage() {
  const ctx = await requireOrg();
  const t = await getT();
  const inbox = supportInbox();

  const rows = [
    { label: t("profile.name"), value: ctx.user.name ?? "—" },
    { label: t("profile.email"), value: ctx.user.email },
    { label: t("profile.role"), value: ctx.role },
    { label: t("profile.org"), value: ctx.organization.name },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("profile.title")} description={t("profile.subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.account")}</CardTitle>
          <CardDescription>{t("profile.account.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <SupportForm supportEmail={inbox} />
    </div>
  );
}
