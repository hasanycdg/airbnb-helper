import type { Metadata } from "next";

// Guest guides must never be indexed by search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
