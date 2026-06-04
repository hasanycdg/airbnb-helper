import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Home,
  Mail,
  MapPin,
  Phone,
  Tag,
  User2,
} from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { ISSUE_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { summarizeIssue } from "@/lib/ai";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { IssueStatusBadge, IssueUrgencyBadge } from "@/components/issues/issue-status-badge";
import { StatusWorkflow } from "@/components/issues/status-workflow";
import { AssignForm } from "@/components/issues/assign-form";
import { UrgencyForm } from "@/components/issues/urgency-form";
import { CommentThread, type CommentWithAuthor } from "@/components/issues/comment-thread";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const issue = await db.issue.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: issue?.title ?? "Issue" };
}

export default async function IssueDetailPage({ params }: PageProps) {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;
  const { id } = await params;

  if (!can(ctx.role, "issues:view")) {
    notFound();
  }

  const issue = await db.issue.findFirst({
    where: { id, organizationId: orgId },
    include: {
      property: { select: { id: true, publicName: true } },
      assignedTo: { select: { id: true, name: true } },
      guestStay: {
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          checkIn: true,
          checkOut: true,
        },
      },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) notFound();

  // Load org members for the assign dropdown
  const members = await db.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const teamMembers = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

  const canManage = can(ctx.role, "issues:manage");

  // AI summary (best-effort, no throw)
  let aiSummary: string | null = null;
  if (issue.description && issue.description.trim().length > 40) {
    try {
      aiSummary = await summarizeIssue(
        [issue.title, issue.description].filter(Boolean).join("\n"),
      );
    } catch {
      aiSummary = null;
    }
  }

  const comments = issue.comments as CommentWithAuthor[];

  return (
    <>
      <PageHeader
        title={issue.title}
        description={`${issue.property.publicName} · ${ISSUE_CATEGORY_LABELS[issue.category]}`}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/issues">
            <ArrowLeft /> All issues
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Issue overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <IssueStatusBadge status={issue.status} />
                <IssueUrgencyBadge urgency={issue.urgency} />
                <Badge variant="outline" className="capitalize">
                  {issue.source.toLowerCase()}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(issue.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiSummary && (
                <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
                  <span className="mr-2 font-medium text-muted-foreground">AI summary:</span>
                  {aiSummary}
                </div>
              )}

              {issue.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
                </div>
              )}

              {issue.roomLocation && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span>{issue.roomLocation}</span>
                </div>
              )}

              {issue.resolvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Resolved:</span>
                  <span>{formatDateTime(issue.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {issue.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {issue.photos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      <Image
                        src={url}
                        alt={`Issue photo ${i + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusWorkflow
                issueId={issue.id}
                current={issue.status}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                issueId={issue.id}
                comments={comments}
                canManage={canManage}
                canView={can(ctx.role, "issues:view")}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Guest info */}
          {(issue.guestName ?? issue.guestContact ?? issue.guestStay) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(issue.guestName ?? issue.guestStay?.guestName) && (
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span>{issue.guestName ?? issue.guestStay?.guestName}</span>
                  </div>
                )}
                {(issue.guestContact ?? issue.guestStay?.guestEmail) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="break-all">
                      {issue.guestContact ?? issue.guestStay?.guestEmail}
                    </span>
                  </div>
                )}
                {issue.guestStay?.guestPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{issue.guestStay.guestPhone}</span>
                  </div>
                )}
                {issue.contactPreference && (
                  <p className="text-xs text-muted-foreground">
                    Contact preference: {issue.contactPreference}
                  </p>
                )}
                {issue.guestStay && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        {formatDate(issue.guestStay.checkIn)} –{" "}
                        {formatDate(issue.guestStay.checkOut)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Property */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <Link
                  href={`/properties/${issue.property.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {issue.property.publicName}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{ISSUE_CATEGORY_LABELS[issue.category]}</span>
              </div>
            </CardContent>
          </Card>

          {/* Urgency (editable for managers) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Urgency</CardTitle>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <UrgencyForm issueId={issue.id} currentUrgency={issue.urgency} />
              ) : (
                <IssueUrgencyBadge urgency={issue.urgency} />
              )}
            </CardContent>
          </Card>

          {/* Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignee</CardTitle>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <AssignForm
                  issueId={issue.id}
                  currentAssigneeId={issue.assignedToId}
                  members={teamMembers}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {issue.assignedTo?.name ?? "Unassigned"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
