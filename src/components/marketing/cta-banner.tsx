import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-8 py-14 text-center text-primary-foreground shadow-lg">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to reclaim your evenings?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-primary-foreground/80 sm:text-lg">
          Set up your first guide in under 10 minutes. 14-day free trial — no credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto"
          >
            <Link href="/register">
              Start your free trial
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="w-full text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
          >
            <Link href="/g/city-apartment-innsbruck">See a live guide demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
