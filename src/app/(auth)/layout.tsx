import Link from "next/link";
import { MapPinned } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MapPinned className="h-5 w-5" />
            </span>
            StayGuide Pro
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden bg-primary lg:block">
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-12 text-primary-foreground">
          <blockquote className="text-2xl font-medium leading-snug">
            “Our guests stopped asking how the heating works. The guide answers everything — in
            their own language.”
          </blockquote>
          <p className="text-primary-foreground/80">Demo Property Management, Tirol</p>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_55%)]" />
      </div>
    </div>
  );
}
