import "server-only";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { loadTranslations, toLocale, translateField } from "@/lib/i18n";
import type { KnowledgeSection } from "@/lib/ai";

export interface GuideSectionView {
  id: string;
  slug: string;
  type: string;
  icon: string | null;
  title: string;
  shortDescription: string;
  content: string;
  mapEmbedUrl: string | null;
  media: { id: string; type: string; url: string; thumbnailUrl: string | null; title: string | null }[];
}

export interface GuideRecommendationView {
  id: string;
  category: string;
  title: string;
  description: string;
  address: string | null;
  mapUrl: string | null;
  website: string | null;
  phone: string | null;
  openingHours: string | null;
  imageUrl: string | null;
}

export interface PublishedGuide {
  property: {
    id: string;
    slug: string;
    publicName: string;
    city: string | null;
    coverImageUrl: string | null;
    primaryColor: string;
    logoUrl: string | null;
    baseLocale: Locale;
    supportedLocales: Locale[];
    emergencyContacts: { label: string; phone: string }[];
    hostName: string | null;
    hostPhone: string | null;
    aiEnabled: boolean;
    isPublished: boolean;
    updatedAt: Date;
  };
  organizationId: string;
  locale: Locale;
  sections: GuideSectionView[];
  recommendations: GuideRecommendationView[];
}

/**
 * Load a published guide for the public guest experience, localized to the
 * requested language (falling back to the property's base language when the
 * requested one is missing or unsupported).
 */
export async function getPublishedGuide(
  slug: string,
  requestedLocale: string | null,
  allowDraft = false,
): Promise<PublishedGuide | null> {
  const property = await db.property.findUnique({
    where: { slug },
    include: {
      organization: { select: { id: true, name: true, primaryColor: true, logoUrl: true } },
      sections: {
        where: { isVisible: true },
        orderBy: { order: "asc" },
        include: {
          media: { select: { id: true, type: true, url: true, thumbnailUrl: true, title: true } },
        },
      },
      recommendations: { where: { isVisible: true }, orderBy: { order: "asc" } },
    },
  });

  if (!property) return null;
  if (!property.isPublished && !allowDraft) return null;

  const base = property.baseLocale;
  const requested = toLocale(requestedLocale, base);
  const locale = property.supportedLocales.includes(requested) ? requested : base;
  const sTr = await loadTranslations(
    "GuideSection",
    property.sections.map((s) => s.id),
  );
  const rTr = await loadTranslations(
    "Recommendation",
    property.recommendations.map((r) => r.id),
  );

  const sections: GuideSectionView[] = property.sections.map((s) => ({
    id: s.id,
    slug: s.slug,
    type: s.type,
    icon: s.icon,
    title: translateField(s.title, sTr[s.id], "title", locale, base),
    shortDescription: translateField(s.shortDescription ?? "", sTr[s.id], "shortDescription", locale, base),
    content: translateField(s.content, sTr[s.id], "content", locale, base),
    mapEmbedUrl: s.mapEmbedUrl,
    media: s.media,
  }));

  const recommendations: GuideRecommendationView[] = property.recommendations.map((r) => ({
    id: r.id,
    category: r.category,
    title: translateField(r.title, rTr[r.id], "title", locale, base),
    description: translateField(r.description ?? "", rTr[r.id], "description", locale, base),
    address: r.address,
    mapUrl: r.mapUrl,
    website: r.website,
    phone: r.phone,
    openingHours: r.openingHours,
    imageUrl: r.imageUrl,
  }));

  return {
    property: {
      id: property.id,
      slug: property.slug,
      publicName: property.publicName,
      city: property.city,
      coverImageUrl: property.coverImageUrl,
      primaryColor: property.brandingPrimaryColor ?? property.organization.primaryColor,
      logoUrl: property.brandingLogoUrl ?? property.organization.logoUrl,
      baseLocale: base,
      supportedLocales: property.supportedLocales,
      emergencyContacts: (property.emergencyContacts as { label: string; phone: string }[] | null) ?? [],
      hostName: property.hostName,
      hostPhone: property.hostPhone,
      aiEnabled: property.aiEnabled,
      isPublished: property.isPublished,
      updatedAt: property.updatedAt,
    },
    organizationId: property.organization.id,
    locale,
    sections,
    recommendations,
  };
}

/** Build the grounded knowledge base passed to the guest AI assistant. */
export function buildKnowledge(guide: PublishedGuide): KnowledgeSection[] {
  return guide.sections.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    content: s.content,
    shortDescription: s.shortDescription,
  }));
}
