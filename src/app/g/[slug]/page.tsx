import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getPublishedGuide } from "@/lib/guide-data";
import { trackGuideView } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { getT } from "@/lib/app-locale";
import { formatDate } from "@/lib/utils";
import { GuestGuide } from "@/components/guest/guest-guide";
import { AiChat } from "@/components/guest/ai-chat";
import { LanguageSwitcher } from "@/components/guest/language-switcher";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ lang?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug, null);
  return { title: guide ? `${guide.property.publicName} — Guest guide` : "Guest guide" };
}

export default async function GuestGuidePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const guide = await getPublishedGuide(slug, lang ?? null, true);
  if (!guide) notFound();

  const { property, locale } = guide;

  // Record a view (best-effort).
  await trackGuideView({
    organizationId: guide.organizationId,
    propertyId: property.id,
    locale,
  });

  const labels = {
    search_placeholder: t(locale, "search_placeholder"),
    no_results: t(locale, "no_results"),
    recommendations: t(locale, "recommendations"),
    emergency: t(locale, "emergency"),
    report_issue: t(locale, "report_issue"),
    contact_host: t(locale, "contact_host"),
    ask_assistant: t(locale, "ask_assistant"),
    ask_placeholder: t(locale, "ask_placeholder"),
    loading: t(locale, "loading"),
    send: t(locale, "send"),
    need_help: t(locale, "need_help"),
  };

  const appT = await getT();

  return (
    <>
      {!property.isPublished && (
        <div className="bg-warning px-4 py-2 text-center text-sm font-medium text-warning-foreground">
          {appT("guide.draftBanner")}
        </div>
      )}
      <div className="mx-auto max-w-2xl pb-24">
      {/* Header / cover */}
      <header className="relative h-52 w-full overflow-hidden sm:h-60">
        {property.coverImageUrl ? (
          <Image
            src={property.coverImageUrl}
            alt={property.publicName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: property.primaryColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute right-3 top-3">
          <LanguageSwitcher locales={property.supportedLocales} current={locale} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h1 className="text-2xl font-semibold drop-shadow">{property.publicName}</h1>
          {property.city && (
            <p className="flex items-center gap-1 text-sm text-white/90">
              <MapPin className="h-3.5 w-3.5" /> {property.city}
            </p>
          )}
        </div>
      </header>

      <div className="px-4 py-5">
        <GuestGuide
          slug={slug}
          sections={guide.sections}
          recommendations={guide.recommendations}
          emergencyContacts={property.emergencyContacts}
          hostName={property.hostName}
          hostPhone={property.hostPhone}
          labels={labels}
        />

        <footer className="mt-8 space-y-1 border-t pt-5 text-center text-xs text-muted-foreground">
          <p>
            {t(locale, "last_updated")}: {formatDate(property.updatedAt)}
          </p>
          <p>{t(locale, "powered_by")}</p>
        </footer>
      </div>

      {property.aiEnabled && <AiChat slug={slug} locale={locale} labels={labels} />}
      </div>
    </>
  );
}
