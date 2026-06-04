import { AlertTriangle, CalendarDays, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateReviewRequestButton } from "@/components/reviews/create-review-request-button";
import { type StayNeedingRequest } from "@/server/reviews";
import { formatDate } from "@/lib/utils";

interface Props {
  stay: StayNeedingRequest;
  unresolvedIssues: number;
}

export function PendingStayCard({ stay, unresolvedIssues }: Props) {
  const guestName = stay.guestName ?? "Unknown guest";
  const checkIn = formatDate(stay.checkIn);
  const checkOut = formatDate(stay.checkOut);
  const hasIssues = unresolvedIssues > 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate font-medium">{guestName}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {stay.property.publicName} · {checkIn} – {checkOut}
          </div>
          {hasIssues && (
            <p className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              {unresolvedIssues} unresolved issue{unresolvedIssues === 1 ? "" : "s"} — review after resolving
            </p>
          )}
        </div>
        <CreateReviewRequestButton guestStayId={stay.id} />
      </CardContent>
    </Card>
  );
}
