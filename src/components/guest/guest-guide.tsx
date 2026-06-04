"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Phone, Search, Sparkles } from "lucide-react";
import type { Locale } from "@prisma/client";
import type { GuideRecommendationView, GuideSectionView } from "@/lib/guide-data";
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import { SectionIcon } from "@/components/shared/section-icon";
import { Markdown } from "@/components/guest/markdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GuestGuideProps {
  slug: string;
  sections: GuideSectionView[];
  recommendations: GuideRecommendationView[];
  emergencyContacts: { label: string; phone: string }[];
  hostName: string | null;
  hostPhone: string | null;
  labels: Record<string, string>;
}

export function GuestGuide({
  slug,
  sections,
  recommendations,
  emergencyContacts,
  hostName,
  hostPhone,
  labels,
}: GuestGuideProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) =>
      `${s.title} ${s.shortDescription} ${s.content}`.toLowerCase().includes(q),
    );
  }, [query, sections]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="sticky top-2 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search_placeholder}
            className="h-11 rounded-full pl-10 shadow-sm"
          />
        </div>
      </div>

      {/* Category chips */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium"
            >
              <SectionIcon name={s.icon} className="h-3.5 w-3.5" />
              {s.title}
            </a>
          ))}
        </div>
      )}

      {/* Sections */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{labels.no_results}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <section
              key={s.id}
              id={s.slug}
              className="scroll-mt-20 rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <SectionIcon name={s.icon} />
                </span>
                <div>
                  <h2 className="font-semibold">{s.title}</h2>
                  {s.shortDescription && (
                    <p className="text-xs text-muted-foreground">{s.shortDescription}</p>
                  )}
                </div>
              </div>

              {s.content && <Markdown content={s.content} className="text-sm text-foreground/90" />}

              {/* Media */}
              {s.media.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {s.media.map((m) =>
                    m.type === "VIDEO" ? (
                      <video
                        key={m.id}
                        controls
                        poster={m.thumbnailUrl ?? undefined}
                        className="w-full rounded-lg border"
                      >
                        <source src={m.url} />
                      </video>
                    ) : m.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={m.id} src={m.url} alt={m.title ?? ""} className="w-full rounded-lg border object-cover" />
                    ) : (
                      <a key={m.id} href={m.url} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <ExternalLink className="h-4 w-4" /> {m.title ?? "Download"}
                      </a>
                    ),
                  )}
                </div>
              )}

              {s.mapEmbedUrl && (
                <iframe
                  src={s.mapEmbedUrl}
                  className="mt-3 aspect-video w-full rounded-lg border"
                  loading="lazy"
                  title={`Map: ${s.title}`}
                />
              )}
            </section>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {!query && recommendations.length > 0 && (
        <section id="recommendations" className="scroll-mt-20 space-y-3 pt-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" /> {labels.recommendations}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendations.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {RECOMMENDATION_CATEGORY_LABELS[r.category as keyof typeof RECOMMENDATION_CATEGORY_LABELS] ?? r.category}
                </p>
                <p className="font-medium">{r.title}</p>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {r.mapUrl && (
                    <a href={r.mapUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                      Map
                    </a>
                  )}
                  {r.website && (
                    <a href={r.website} target="_blank" rel="noreferrer" className="text-primary underline">
                      Website
                    </a>
                  )}
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="text-primary underline">
                      Call
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emergency */}
      {!query && (emergencyContacts.length > 0 || hostPhone) && (
        <section id="emergency" className="scroll-mt-20 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" /> {labels.emergency}
          </h2>
          <div className="mt-3 space-y-2">
            {emergencyContacts.map((c, i) => (
              <a key={i} href={`tel:${c.phone}`} className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
                <span>{c.label}</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Phone className="h-3.5 w-3.5" /> {c.phone}
                </span>
              </a>
            ))}
            {hostPhone && (
              <a href={`tel:${hostPhone}`} className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
                <span>{hostName ?? labels.contact_host}</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Phone className="h-3.5 w-3.5" /> {hostPhone}
                </span>
              </a>
            )}
          </div>
          <Link
            href={`/g/${slug}/report`}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground"
          >
            <AlertTriangle className="h-4 w-4" /> {labels.report_issue}
          </Link>
        </section>
      )}
    </div>
  );
}
