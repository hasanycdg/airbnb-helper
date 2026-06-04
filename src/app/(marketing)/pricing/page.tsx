import type { Metadata } from "next";
import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { PricingCard } from "@/components/marketing/pricing-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import type { PlanTier } from "@prisma/client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for vacation-rental hosts. Start free — no credit card required.",
};

// Display order for the pricing page
const PLAN_ORDER: PlanTier[] = ["TRIAL", "STARTER", "PRO", "PREMIUM", "MANAGER"];

const FAQ_ITEMS = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The 14-day free trial gives you full Pro access and requires no payment details.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes — upgrade or downgrade any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What happens after the trial?",
    a: "You choose a paid plan or your account moves to read-only mode. Your data is always safe.",
  },
  {
    q: "Is there a per-property fee?",
    a: "No — each plan includes a set number of properties. The Manager plan supports unlimited properties.",
  },
  {
    q: "What languages does the AI translation support?",
    a: "German, English, Italian, French, Dutch, Spanish and Turkish — with more on the roadmap.",
  },
  {
    q: "Can my cleaning team use the app?",
    a: "Yes. Add team members with the Cleaner role; they can access and complete cleaning checklists on their phone.",
  },
] as const;

export default function PricingPage() {
  const plans = PLAN_ORDER.map((tier) => PLANS[tier]);

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-accent/30 to-background px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 text-lg text-muted-foreground">
            Start free for 14 days. No credit card required. Scale as you grow.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {plans.map((plan) => (
            <PricingCard key={plan.tier} plan={plan} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All prices are in EUR, billed monthly. Annual billing available — save up to 20%.{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Start your free trial &rarr;
          </Link>
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
          What&apos;s included
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                {plans.map((p) => (
                  <th
                    key={p.tier}
                    className="px-3 py-3 text-center font-semibold text-muted-foreground"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  {plans.map((p) => {
                    const cell = row.values[p.tier];
                    return (
                      <td key={p.tier} className="px-3 py-3 text-center text-muted-foreground">
                        {cell === true ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : cell === false ? (
                          <span className="text-border">—</span>
                        ) : (
                          <span className="text-xs font-medium text-foreground">{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{q}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}

// ── Comparison table data ─────────────────────────────────────────────────

interface ComparisonRow {
  label: string;
  values: Record<PlanTier, boolean | string>;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Properties",
    values: {
      TRIAL: "1",
      STARTER: "1",
      PRO: "3",
      PREMIUM: "10",
      MANAGER: "Unlimited",
    },
  },
  {
    label: "Digital guest guide",
    values: {
      TRIAL: true,
      STARTER: true,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "QR codes",
    values: {
      TRIAL: true,
      STARTER: true,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Video FAQ",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Multilingual + AI translation",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Automated messages",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Analytics",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Guest AI assistant",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: false,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Issue reporting",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: false,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Cleaning & turnover",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: false,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Inventory & restocking",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: false,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Review assistant",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: false,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "Team roles & permissions",
    values: {
      TRIAL: true,
      STARTER: false,
      PRO: true,
      PREMIUM: true,
      MANAGER: true,
    },
  },
  {
    label: "White-label branding",
    values: {
      TRIAL: false,
      STARTER: false,
      PRO: false,
      PREMIUM: false,
      MANAGER: true,
    },
  },
  {
    label: "Priority support",
    values: {
      TRIAL: false,
      STARTER: false,
      PRO: false,
      PREMIUM: false,
      MANAGER: true,
    },
  },
];
