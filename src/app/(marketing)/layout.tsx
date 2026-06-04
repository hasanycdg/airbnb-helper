import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: {
    default: "StayGuide Pro — Digital Guest Guides for Vacation Rentals",
    template: "%s · StayGuide Pro",
  },
  description:
    "Create digital guest guides that cut repetitive questions, prevent bad reviews, and organise cleaning and turnovers. Trusted by vacation-rental hosts across Europe.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
