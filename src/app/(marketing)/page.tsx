import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { FeatureHighlights } from "@/components/marketing/feature-highlights";
import { Testimonial } from "@/components/marketing/testimonial";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const metadata: Metadata = {
  title: "StayGuide Pro — Digital Guest Guides that Cut Questions & Prevent Bad Reviews",
  description:
    "Create mobile-first digital guest guides with AI translation, video FAQ, guest AI chat, and cleaning management. Trusted by vacation-rental hosts across Europe.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <FeatureHighlights />
      <Testimonial />
      <CtaBanner />
    </>
  );
}
