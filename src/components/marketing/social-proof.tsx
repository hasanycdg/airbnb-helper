import { Star } from "lucide-react";

const STATS = [
  { value: "2 400+", label: "Properties using StayGuide" },
  { value: "80%", label: "Fewer guest questions" },
  { value: "4.9★", label: "Average host rating after 3 months" },
  { value: "7 languages", label: "Auto-translated by AI" },
] as const;

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/30 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Stars */}
        <div className="mb-8 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-warning text-warning" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
