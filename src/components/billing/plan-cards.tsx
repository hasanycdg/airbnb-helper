"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import type { PlanTier } from "@prisma/client";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { changePlan, type BillingState } from "@/server/billing";
import { cn } from "@/lib/utils";

const DISPLAY_TIERS: PlanTier[] = ["STARTER", "PRO", "PREMIUM", "MANAGER"];

interface PlanCardsProps {
  currentPlan: PlanTier;
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `€${(cents / 100).toFixed(0)}/mo`;
}

function PlanCard({
  tier,
  currentPlan,
}: {
  tier: PlanTier;
  currentPlan: PlanTier;
}) {
  const plan = PLANS[tier];
  const isCurrent = tier === currentPlan;
  const [state, action, isPending] = useActionState<BillingState, FormData>(
    changePlan,
    undefined,
  );
  const { toast } = useToast();
  const toastFiredRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    if (toastFiredRef.current) return;
    if (state.success) {
      toastFiredRef.current = true;
      toast({ title: "Plan updated", description: `You are now on the ${plan.name} plan.` });
    } else if (state.error) {
      toastFiredRef.current = true;
      toast({ title: "Could not change plan", description: state.error, variant: "destructive" });
    }
  }, [state, plan.name, toast]);

  // Reset toast guard when state changes back to undefined (new submission).
  useEffect(() => {
    if (!state) toastFiredRef.current = false;
  }, [state]);

  const isUpgrade =
    DISPLAY_TIERS.indexOf(tier) > DISPLAY_TIERS.indexOf(currentPlan as PlanTier) ||
    currentPlan === "TRIAL";

  const buttonLabel = isCurrent
    ? "Current plan"
    : isUpgrade
      ? "Upgrade"
      : "Downgrade";

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.highlighted && "border-primary shadow-md",
        isCurrent && "ring-2 ring-primary/30",
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 px-3 py-0.5 text-xs">
            <Sparkles className="h-3 w-3" /> Most popular
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <CardDescription>{plan.tagline}</CardDescription>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatPrice(plan.priceMonthly)}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="pt-4">
        {isCurrent ? (
          <Button variant="secondary" className="w-full" disabled>
            <Check className="h-4 w-4" />
            {buttonLabel}
          </Button>
        ) : (
          <form action={action} className="w-full">
            <input type="hidden" name="plan" value={tier} />
            <SubmitButton
              className="w-full"
              variant={isUpgrade ? "default" : "outline"}
              pendingText={isUpgrade ? "Redirecting…" : "Downgrading…"}
              disabled={isPending}
            >
              <Zap className="h-4 w-4" />
              {buttonLabel}
            </SubmitButton>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}

export function PlanCards({ currentPlan }: PlanCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DISPLAY_TIERS.map((tier) => (
        <PlanCard key={tier} tier={tier} currentPlan={currentPlan} />
      ))}
    </div>
  );
}
