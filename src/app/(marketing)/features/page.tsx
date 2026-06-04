import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  MessageSquareText,
  Globe,
  Bot,
  QrCode,
  AlertCircle,
  Sparkles,
  BarChart3,
  Package,
  Users,
  Star,
  ArrowRight,
  CheckCircle2,
  LogIn,
  Wifi,
  Thermometer,
  Bike,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore every feature of StayGuide Pro — from digital guest guides and AI translation to cleaning management and analytics.",
};

interface FeatureSection {
  id: string;
  badge: string;
  icon: React.ElementType;
  title: string;
  description: string;
  bullets: string[];
  subFeatures?: { icon: React.ElementType; label: string }[];
  highlight?: boolean;
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: "guide-builder",
    badge: "Core",
    icon: BookOpen,
    title: "Digital guide builder",
    description:
      "Build a beautifully organised guide for every property. Guests open it by scanning a QR code on arrival — no app download, no login. Every section is just a tap away.",
    bullets: [
      "30+ pre-built section types: WiFi, check-in, heating, trash, house rules, restaurants, and more",
      "Rich text editor with markdown, images and embedded maps",
      "Toggle sections visible or hidden without deleting them",
      "Internal notes for your team, invisible to guests",
      "Reorder sections with one click to match your guest journey",
    ],
    subFeatures: [
      { icon: LogIn, label: "Check-in steps" },
      { icon: Wifi, label: "WiFi & smart home" },
      { icon: Thermometer, label: "Appliance guides" },
      { icon: Bike, label: "Local tips" },
    ],
  },
  {
    id: "video-faq",
    badge: "Pro+",
    icon: MessageSquareText,
    title: "Video FAQ system",
    description:
      "Some instructions are just easier to show. Attach short how-to videos to any guide section so guests can watch exactly how the coffee machine or TV remote works.",
    bullets: [
      "Upload or record short videos directly from your phone",
      "Attach multiple videos per section with captions",
      "Videos are compressed and streamed — no buffering for guests",
      "Works offline after first load (PWA caching)",
    ],
  },
  {
    id: "multilingual",
    badge: "Pro+",
    icon: Globe,
    title: "Multilingual + AI translation",
    description:
      "Write your guide once in your language. StayGuide Pro AI translates every section into 7 languages with a single click — or translate selected sections manually.",
    bullets: [
      "Supported languages: German, English, Italian, French, Dutch, Spanish, Turkish",
      "AI translation respects your property name and key terms as a glossary",
      "Override any AI translation with your own text",
      "Machine-translated content is clearly flagged until you review it",
      "Guests automatically see the guide in their browser language",
    ],
    highlight: true,
  },
  {
    id: "ai-assistant",
    badge: "Premium+",
    icon: Bot,
    title: "Grounded guest AI assistant",
    description:
      "Your guide powers a conversational AI that answers questions accurately and exclusively from your content. Guests get instant, reliable answers — at 2am if needed.",
    bullets: [
      "Answers only from your guide content — no hallucinated advice",
      "Handles follow-up questions in context (multi-turn conversation)",
      "Falls back gracefully when a question is outside the guide scope",
      "All questions are logged so you can improve the guide over time",
      "Supports all 7 guide languages",
    ],
    highlight: true,
  },
  {
    id: "qr-codes",
    badge: "All plans",
    icon: QrCode,
    title: "QR codes for everything",
    description:
      "Generate QR codes for the full guide, individual sections, or specific actions like issue reporting. Print, laminate, and place them exactly where guests need help.",
    bullets: [
      "Full guide QR — one code to rule them all",
      "Section QR codes for WiFi, parking, trash, heating, checkout",
      "Issue-report QR code for walls and appliances",
      "Download as PNG or SVG for professional printing",
      "Short URLs for text messages and welcome booklets",
    ],
  },
  {
    id: "issues",
    badge: "Premium+",
    icon: AlertCircle,
    title: "Issue reporting & tracking",
    description:
      "Guests scan a QR code to report a broken item or missing supply. You get a notification, assign it to your team, and track it to resolution — all in one place.",
    bullets: [
      "12 issue categories: WiFi, heating, cleanliness, broken items, and more",
      "Guests can add a photo and description without creating an account",
      "Status flow: New → Acknowledged → Assigned → In progress → Resolved",
      "Comment thread for your team; internal notes stay private",
      "Full audit history for every issue",
    ],
  },
  {
    id: "cleaning",
    badge: "Premium+",
    icon: Sparkles,
    title: "Cleaning & turnover management",
    description:
      "Assign turnovers to your cleaning team with checklist templates, photo requirements, and completion confirmations. No more chasing cleaners on WhatsApp.",
    bullets: [
      "Custom checklist templates per property",
      "Assign turnovers with check-in / check-out times visible",
      "Cleaners complete tasks on their phone, upload photos as proof",
      "Manager sees real-time progress and gets notified on completion",
      "Restocking tasks linked to inventory items",
    ],
  },
  {
    id: "inventory",
    badge: "Premium+",
    icon: Package,
    title: "Inventory & restocking",
    description:
      "Track consumable supplies — toilet paper, coffee, dishwasher tabs — across all properties. Cleaners report low stock; you see exactly what needs ordering.",
    bullets: [
      "Pre-seeded with 12 common vacation-rental consumables",
      "Set minimum thresholds; get alerts when stock runs low",
      "Cleaners report restocking needs during turnovers",
      "Full restock history per property",
    ],
  },
  {
    id: "messaging",
    badge: "Pro+",
    icon: MessageSquare,
    title: "Automated message templates",
    description:
      "Create message templates for every stage of the guest journey — booking confirmation, pre-arrival, check-in day, satisfaction check, checkout reminder, and review request.",
    bullets: [
      "10 message types covering the full stay lifecycle",
      "Template variables: guest name, WiFi password, guide link, checkout time…",
      "Schedule sends relative to check-in or check-out",
      "AI-drafted review request timed for the perfect post-stay moment",
    ],
  },
  {
    id: "analytics",
    badge: "Pro+",
    icon: BarChart3,
    title: "Analytics & insights",
    description:
      "See which guide sections guests actually read, which questions the AI gets asked most, and how satisfaction scores track over time. Make every guide better.",
    bullets: [
      "Guide pageview analytics by section",
      "AI question log with topics and resolution rates",
      "Guest satisfaction scores from mid-stay check-ins",
      "Issue category breakdown",
      "Export data as CSV",
    ],
  },
  {
    id: "reviews",
    badge: "Premium+",
    icon: Star,
    title: "Review assistant",
    description:
      "Prompt happy guests to leave a review at the right moment. The AI drafts a personalised review request message based on the stay details — you edit and send.",
    bullets: [
      "Automatic timing: sends 2 hours after checkout",
      "AI drafts the message using guest name and property details",
      "Direct Airbnb / Booking.com review link",
      "Track review request status per stay",
    ],
  },
  {
    id: "team",
    badge: "Pro+",
    icon: Users,
    title: "Team roles & permissions",
    description:
      "Invite your team with the right level of access. Owners control everything; managers handle operations; cleaners see only what they need for turnovers.",
    bullets: [
      "Three roles: Owner, Manager, Cleaner",
      "Granular permissions — issues, cleaning, inventory, analytics, billing",
      "Invite by email; invitation expires after 7 days",
      "Activity audit log for compliance",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-accent/30 to-background px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Everything a vacation-rental host needs
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            One platform covering the full guest experience — from the moment they book to the
            review they leave.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Start free trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Table of contents */}
      <nav
        className="sticky top-16 z-40 hidden border-b border-border/60 bg-background/95 backdrop-blur lg:block"
        aria-label="Feature sections"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6 py-2">
          {FEATURE_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Feature sections */}
      <div className="mx-auto max-w-6xl divide-y divide-border/50 px-4 sm:px-6">
        {FEATURE_SECTIONS.map((section, i) => (
          <FeatureSectionBlock key={section.id} section={section} reversed={i % 2 !== 0} />
        ))}
      </div>

      <CtaBanner />
    </>
  );
}

function FeatureSectionBlock({
  section,
  reversed,
}: {
  section: FeatureSection;
  reversed: boolean;
}) {
  const Icon = section.icon;

  return (
    <section id={section.id} className="scroll-mt-32 py-14">
      <div
        className={cn(
          "flex flex-col gap-10 md:flex-row md:items-start",
          reversed && "md:flex-row-reverse",
        )}
      >
        {/* Text side */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                section.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {section.badge}
            </Badge>
          </div>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{section.description}</p>

          <ul className="space-y-2.5">
            {section.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual side — decorative card */}
        <div className="flex-1">
          <div
            className={cn(
              "h-full min-h-[220px] rounded-2xl border-2 p-6",
              section.highlight
                ? "border-primary/30 bg-accent/30"
                : "border-border bg-muted/30",
            )}
          >
            <div className="flex flex-col gap-3">
              {/* Mock content card */}
              <div className="flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 shadow-sm">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    section.highlight
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-2.5 w-24 rounded bg-muted" />
                  <div className="mt-1.5 h-2 w-36 rounded bg-muted/60" />
                </div>
              </div>

              {/* Sub-feature chips */}
              {section.subFeatures && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {section.subFeatures.map(({ icon: SubIcon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm"
                    >
                      <SubIcon className="h-3 w-3 text-primary" />
                      {label}
                    </div>
                  ))}
                </div>
              )}

              {/* Placeholder rows */}
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 shadow-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-primary/40" />
                  <div
                    className="h-2 rounded bg-muted"
                    style={{ width: `${60 + idx * 10}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
