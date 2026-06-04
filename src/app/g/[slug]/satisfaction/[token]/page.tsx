import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { SatisfactionForm } from "@/components/guest/satisfaction-form";

export default async function SatisfactionPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const check = await db.satisfactionCheck.findFirst({
    where: { token, property: { slug } },
    include: { property: { select: { publicName: true, baseLocale: true } } },
  });
  if (!check) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="mb-2 text-sm text-muted-foreground">{check.property.publicName}</p>
      <SatisfactionForm token={token} question={t(check.property.baseLocale, "your_stay_ok")} />
    </div>
  );
}
