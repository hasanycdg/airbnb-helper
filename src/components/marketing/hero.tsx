import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquareText,
  Globe,
  Bot,
  QrCode,
  AlertCircle,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/40 to-background px-4 py-20 text-center sm:px-6 sm:py-28">
      {/* Decorative background rings */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[500px] w-[500px] rounded-full border border-primary/10 opacity-60" />
        <div className="absolute h-[720px] w-[720px] rounded-full border border-primary/5 opacity-40" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <Badge
          variant="secondary"
          className="mb-5 gap-1.5 border border-primary/20 bg-accent text-accent-foreground"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          Digital guest guides for vacation rentals
        </Badge>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Stop answering the same{" "}
          <span className="text-primary">guest questions</span> over and over
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          StayGuide Pro creates beautiful, multilingual digital guides that answer every guest
          question before they ask — preventing bad reviews and saving you hours every week.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/register">
              Start free trial — 14 days full access
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/g/city-apartment-innsbruck">See a live demo guide</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required &middot; Set up in under 10 minutes
        </p>
      </div>

      {/* Feature icons strip */}
      <div className="relative mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {HERO_FEATURES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-2 py-3 text-center shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium leading-tight text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const HERO_FEATURES = [
  { icon: BookOpen, label: "Guide builder" },
  { icon: MessageSquareText, label: "Video FAQ" },
  { icon: Globe, label: "Multilingual AI" },
  { icon: Bot, label: "Guest AI chat" },
  { icon: QrCode, label: "QR codes" },
  { icon: AlertCircle, label: "Issue reports" },
  { icon: Sparkles, label: "Cleaning ops" },
  { icon: BarChart3, label: "Analytics" },
] as const;
