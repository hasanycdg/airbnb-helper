import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <MapPin className="h-10 w-10 text-primary" />
      </div>

      <h1 className="text-4xl font-semibold tracking-tight">404</h1>
      <p className="mt-2 text-xl font-medium">Page not found</p>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Looks like this page has checked out. The link might be expired or the address may have
        changed.
      </p>

      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
