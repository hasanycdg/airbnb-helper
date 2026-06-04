import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ISSUE_CATEGORY_LABELS } from "@/lib/constants";
import { IssueStatusBadge, IssueUrgencyBadge } from "@/components/issues/issue-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import type { Issue, IssueComment, Property, User } from "@prisma/client";

export type IssueWithRelations = Issue & {
  property: Pick<Property, "id" | "publicName">;
  assignedTo: Pick<User, "id" | "name"> | null;
  comments: Pick<IssueComment, "id">[];
};

export function IssueCard({ issue }: { issue: IssueWithRelations }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-colors hover:bg-accent/40 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <IssueStatusBadge status={issue.status} />
          <IssueUrgencyBadge urgency={issue.urgency} />
        </div>
        <p className="truncate font-medium group-hover:underline">{issue.title}</p>
        <p className="text-xs text-muted-foreground">
          {issue.property.publicName}
          {" · "}
          {ISSUE_CATEGORY_LABELS[issue.category]}
        </p>
        {issue.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{issue.description}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
        {issue.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {initials(issue.assignedTo.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{issue.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <span className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</span>
        {issue.comments.length > 0 && (
          <span className="text-xs text-muted-foreground">{issue.comments.length} comment{issue.comments.length !== 1 ? "s" : ""}</span>
        )}
      </div>
    </Link>
  );
}
