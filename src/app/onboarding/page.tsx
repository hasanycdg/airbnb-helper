import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MapPinned } from "lucide-react";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your organization" };

export default async function OnboardingPage() {
  await requireAuth();
  const user = await getCurrentUser();
  if (user && user.memberships.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPinned className="h-5 w-5" />
          </span>
          StayGuide Pro
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
          <p className="text-sm text-muted-foreground">
            This is your workspace — it holds your properties, team and billing. You can rename it
            later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
