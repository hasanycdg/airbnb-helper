import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanDefinition } from "@/lib/plans";

interface PricingCardProps {
  plan: PlanDefinition;
}

export function PricingCard({ plan }: PricingCardProps) {
  const priceEur = plan.priceMonthly / 100;
  const isHighlighted = plan.highlighted === true;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        isHighlighted && "border-primary ring-2 ring-primary/30 shadow-md",
      )}
    >
      {/* Popular badge */}
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold shadow">
            Most popular
          </Badge>
        </div>
      )}

      {/* Plan name + tagline */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {plan.priceMonthly === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">Free</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums">€{priceEur}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Limits hint */}
      <div className="mb-5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
        <LimitRow label="Properties" value={plan.limits.properties} />
        <LimitRow label="Team members" value={plan.limits.teamMembers} />
        {plan.limits.aiMessagesPerMonth !== null && plan.limits.aiMessagesPerMonth > 0 && (
          <LimitRow label="AI messages/month" value={plan.limits.aiMessagesPerMonth} />
        )}
        <LimitRow
          label="Storage"
          value={plan.limits.storageMb !== null ? `${plan.limits.storageMb / 1000} GB` : null}
        />
      </div>

      <Button
        asChild
        variant={isHighlighted ? "default" : "outline"}
        className="w-full"
        size="default"
      >
        <Link href="/register">
          {plan.priceMonthly === 0 ? "Start free trial" : "Start trial"}
        </Link>
      </Button>
    </div>
  );
}

function LimitRow({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  if (value === undefined) return null;
  const display = value === null ? "Unlimited" : value;
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="font-medium text-foreground">{display}</span>
    </div>
  );
}
