import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, Phone, Sparkles } from "lucide-react";
import { getPublishedGuide } from "@/lib/guide-data";
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import { Markdown } from "@/components/guest/markdown";
import { SectionIcon } from "@/components/shared/section-icon";
import { PrintButton } from "@/components/print/print-button";
import { formatDate } from "@/lib/utils";
import type { GuideRecommendationView } from "@/lib/guide-data";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ lang?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug, null);
  return {
    title: guide ? `${guide.property.publicName} — Guest Guide (Print)` : "Guest Guide",
    robots: { index: false, follow: false },
  };
}

export default async function PrintGuidePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const guide = await getPublishedGuide(slug, lang ?? null);
  if (!guide) notFound();

  const { property, sections, recommendations } = guide;
  const hasEmergency =
    property.emergencyContacts.length > 0 || Boolean(property.hostPhone);

  return (
    <>
      {/*
       * Print styles: injected inline so they work even without the globals
       * being loaded (e.g. when the user opens the page directly in a new tab
       * and hits Ctrl+P before hydration). The globals.css already defines
       * .no-print { display: none !important } and .print-break.
       */}
      <style>{`
        @media print {
          @page { margin: 18mm 15mm; }
          body { font-size: 11pt; color: #111; }
          .print-section { break-inside: avoid; }
          .print-page-break { break-after: page; }
        }
        @media screen {
          body { background: #f5f5f5; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl bg-white px-6 py-8 text-foreground shadow-sm sm:rounded-xl sm:my-6 print:shadow-none print:rounded-none print:m-0">
        {/* ── Toolbar (screen only) ─────────────────────────────────────── */}
        <div className="no-print mb-6 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Print or save this guide as a PDF for your guests.
          </p>
          <PrintButton />
        </div>

        {/* ── Cover / header ────────────────────────────────────────────── */}
        <header className="mb-8 border-b pb-6">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: property.primaryColor }}
          >
            {property.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.logoUrl}
                alt={property.publicName}
                className="h-10 w-10 rounded object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {property.publicName.slice(0, 1)}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">{property.publicName}</h1>
          {property.city && (
            <p className="mt-1 text-sm text-muted-foreground">{property.city}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: {formatDate(property.updatedAt)}
            {property.hostName && (
              <> &bull; Host: {property.hostName}</>
            )}
            {property.hostPhone && (
              <> &bull; {property.hostPhone}</>
            )}
          </p>
        </header>

        {/* ── Guide sections ────────────────────────────────────────────── */}
        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.slug}
              className="print-section rounded-lg border p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${property.primaryColor}18`, color: property.primaryColor }}
                >
                  <SectionIcon name={section.icon} className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold leading-tight">{section.title}</h2>
                  {section.shortDescription && (
                    <p className="text-xs text-muted-foreground">{section.shortDescription}</p>
                  )}
                </div>
              </div>

              {section.content && (
                <Markdown content={section.content} className="text-sm leading-relaxed" />
              )}

              {/* Map embed is skipped in print — show URL instead if available */}
              {section.mapEmbedUrl && (
                <p className="no-print mt-2">
                  <iframe
                    src={section.mapEmbedUrl}
                    className="aspect-video w-full rounded-lg border"
                    loading="lazy"
                    title={`Map: ${section.title}`}
                  />
                </p>
              )}

              {/* Media links */}
              {section.media.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {section.media.map((m) =>
                    m.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={m.id}
                        src={m.url}
                        alt={m.title ?? ""}
                        className="no-print max-h-52 w-full rounded-lg object-cover"
                      />
                    ) : m.type === "VIDEO" ? (
                      <p key={m.id} className="text-xs text-muted-foreground">
                        Video: {m.title ?? m.url}
                      </p>
                    ) : (
                      <a
                        key={m.id}
                        href={m.url}
                        className="text-xs underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.title ?? "Attachment"}
                      </a>
                    ),
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* ── Recommendations ───────────────────────────────────────────── */}
        {recommendations.length > 0 && (
          <section className="print-section mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5" style={{ color: property.primaryColor }} />
              Local Recommendations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  primaryColor={property.primaryColor}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Emergency contacts ────────────────────────────────────────── */}
        {hasEmergency && (
          <section className="print-section mt-8 rounded-lg border border-red-200 bg-red-50 p-5 print:border-gray-300 print:bg-white">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-red-700 print:text-black">
              <AlertTriangle className="h-5 w-5" />
              Emergency Contacts
            </h2>
            <div className="space-y-2">
              {property.emergencyContacts.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm print:border-gray-200"
                >
                  <span>{c.label}</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {c.phone}
                  </span>
                </div>
              ))}
              {property.hostPhone && (
                <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm print:border-gray-200">
                  <span>{property.hostName ?? "Host"}</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {property.hostPhone}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="mt-10 border-t pt-5 text-center text-xs text-muted-foreground">
          <p>Powered by StayGuide Pro</p>
        </footer>
      </div>
    </>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  primaryColor,
}: {
  rec: GuideRecommendationView;
  primaryColor: string;
}) {
  const categoryLabel =
    RECOMMENDATION_CATEGORY_LABELS[
      rec.category as keyof typeof RECOMMENDATION_CATEGORY_LABELS
    ] ?? rec.category;

  return (
    <div className="print-section rounded-lg border p-3 text-sm">
      <p
        className="mb-0.5 text-xs font-medium uppercase tracking-wide"
        style={{ color: primaryColor }}
      >
        {categoryLabel}
      </p>
      <p className="font-medium">{rec.title}</p>
      {rec.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
      )}
      {rec.address && (
        <p className="mt-1 text-xs text-muted-foreground">{rec.address}</p>
      )}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {rec.phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {rec.phone}
          </span>
        )}
        {rec.openingHours && (
          <span className="text-muted-foreground">{rec.openingHours}</span>
        )}
        {rec.website && (
          <a
            href={rec.website}
            target="_blank"
            rel="noreferrer"
            className="no-print underline"
          >
            Website
          </a>
        )}
        {rec.mapUrl && (
          <a
            href={rec.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="no-print underline"
          >
            Map
          </a>
        )}
      </div>
    </div>
  );
}
