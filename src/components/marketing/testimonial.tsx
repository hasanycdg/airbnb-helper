import { Quote } from "lucide-react";

export function Testimonial() {
  return (
    <section className="bg-primary px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Quote className="mx-auto mb-6 h-8 w-8 text-primary-foreground/50" aria-hidden />
        <blockquote className="text-xl font-medium leading-relaxed text-primary-foreground sm:text-2xl">
          &ldquo;Our guests stopped asking how the heating works, where to park, or what the WiFi
          password is. The guide answers everything — in their own language. Five-star reviews went
          up, support messages dropped by 80%.&rdquo;
        </blockquote>
        <div className="mt-6 space-y-1">
          <p className="font-semibold text-primary-foreground">Maria K.</p>
          <p className="text-sm text-primary-foreground/70">
            Property manager &middot; 8 apartments in Innsbruck
          </p>
        </div>
      </div>
    </section>
  );
}
