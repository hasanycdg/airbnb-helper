import {
  BookOpen,
  MessageSquareText,
  Globe,
  Bot,
  QrCode,
  AlertCircle,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    icon: BookOpen,
    title: "Digital guide builder",
    description:
      "Build a rich property guide with organised sections — WiFi, check-in, heating, house rules, local tips and more. Guests scan a QR code on arrival and everything is right there.",
  },
  {
    icon: MessageSquareText,
    title: "Video FAQ system",
    description:
      "Record short how-to videos for appliances and tricky instructions. Attach them to guide sections so guests can watch rather than wonder — no more blurry photos or long texts.",
  },
  {
    icon: Globe,
    title: "Multilingual + AI translation",
    description:
      "Write your guide once and let AI translate it into German, English, Italian, French, Dutch, Spanish or Turkish with a single click. Every guest reads in their own language.",
    accent: true,
  },
  {
    icon: Bot,
    title: "Grounded guest AI assistant",
    description:
      "Your guide powers a real-time AI chat that answers guest questions accurately and only from your content. Fewer WhatsApp messages at midnight, happier guests.",
    accent: true,
  },
  {
    icon: QrCode,
    title: "QR codes everywhere",
    description:
      "Generate QR codes for your full guide, individual sections (WiFi, parking, trash), or issue reporting. Print, laminate, and place them right where guests need them.",
  },
  {
    icon: AlertCircle,
    title: "Issue reporting",
    description:
      "Guests scan a QR code to report a broken heater or missing towel. You get an instant notification, can assign it to a team member, and track it to resolution.",
  },
  {
    icon: Sparkles,
    title: "Cleaning & turnover management",
    description:
      "Assign turnovers to your cleaning team with checklist templates, photo uploads and completion confirmation. No more chasing cleaners on WhatsApp.",
  },
  {
    icon: BarChart3,
    title: "Analytics & review assistant",
    description:
      "See which guide sections guests read most, which questions get asked, and get AI-drafted review request messages timed for the perfect moment after checkout.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your guests need. Nothing they don&apos;t.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          One platform that handles the entire guest experience — from pre-arrival to checkout and
          beyond.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, accent }: FeatureItem) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        accent && "border-primary/30 bg-accent/20",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          accent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
