import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedGuide } from "@/lib/guide-data";
import { ReportForm } from "@/components/guest/report-form";

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug, null);
  if (!guide) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href={`/g/${slug}`}
        className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to guide
      </Link>
      <h1 className="text-2xl font-semibold">Report a problem</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Let us know about any issue with {guide.property.publicName}. No account needed.
      </p>
      <ReportForm slug={slug} />
    </div>
  );
}
