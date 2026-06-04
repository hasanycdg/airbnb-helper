import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, LogIn, UserPlus, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { acceptInvitation } from "@/server/members";
import { ROLE_LABELS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Accept invitation" };

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteTokenPage({ params }: PageProps) {
  const { token } = await params;

  // Look up the invitation (no auth needed to view, but auth needed to accept).
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, logoUrl: true } } },
  });

  // ── Invalid token ────────────────────────────────────────────────────────
  if (!invitation) {
    return (
      <InvitePage>
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="items-center text-center">
            <XCircle className="mb-2 h-10 w-10 text-destructive" />
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has already been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </InvitePage>
    );
  }

  // ── Expired / revoked ────────────────────────────────────────────────────
  const isExpired =
    invitation.status === "EXPIRED" ||
    invitation.status === "REVOKED" ||
    invitation.expiresAt < new Date();

  if (isExpired) {
    return (
      <InvitePage>
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="items-center text-center">
            <Clock className="mb-2 h-10 w-10 text-warning" />
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation to <strong>{invitation.organization.name}</strong> has expired or
              was revoked. Ask the team owner to send a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </InvitePage>
    );
  }

  // ── Already accepted ──────────────────────────────────────────────────────
  if (invitation.status === "ACCEPTED") {
    return (
      <InvitePage>
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="mb-2 h-10 w-10 text-success" />
            <CardTitle>Already accepted</CardTitle>
            <CardDescription>
              This invitation has already been accepted. You can log in and switch to{" "}
              <strong>{invitation.organization.name}</strong> from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </InvitePage>
    );
  }

  // ── Check whether the visitor is authenticated ────────────────────────────
  const session = await getSession();

  if (!session) {
    // Unauthenticated: show the org name + login / register links.
    return (
      <InvitePage>
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="items-center text-center">
            <CardTitle>You&apos;ve been invited</CardTitle>
            <CardDescription>
              Join <strong>{invitation.organization.name}</strong> on StayGuide Pro as a{" "}
              <strong>{ROLE_LABELS[invitation.role]}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Sign in or create an account to accept this invitation.</p>
            <p className="mt-1">
              This invitation expires on{" "}
              <strong>
                {invitation.expiresAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              .
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/login?redirect=/invite/${token}`}>
                <LogIn /> Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/register?redirect=/invite/${token}`}>
                <UserPlus /> Create account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </InvitePage>
    );
  }

  // ── Authenticated: accept immediately ────────────────────────────────────
  const result = await acceptInvitation(token);

  if (result.ok) {
    redirect("/dashboard");
  }

  // Error states when authenticated
  const errorMap: Record<string, string> = {
    expired: "This invitation has expired or was revoked.",
    used: "This invitation has already been accepted.",
    not_found: "This invitation could not be found.",
    unauthenticated: "You need to be signed in to accept an invitation.",
  };

  return (
    <InvitePage>
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="items-center text-center">
          <XCircle className="mb-2 h-10 w-10 text-destructive" />
          <CardTitle>Could not accept invitation</CardTitle>
          <CardDescription>{errorMap[result.error] ?? "Something went wrong."}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </InvitePage>
  );
}

// ── Layout wrapper ────────────────────────────────────────────────────────────

function InvitePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight">
        <span className="text-primary">StayGuide</span>
        <span>Pro</span>
      </div>
      {children}
    </div>
  );
}
