import type { Metadata } from "next";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  listStaysNeedingRequest,
  listReviewRequests,
  unresolvedIssueCountsByProperty,
} from "@/server/reviews";
import { ReviewRequestCard } from "@/components/reviews/review-request-card";
import { PendingStayCard } from "@/components/reviews/pending-stay-card";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;

  const [staysNeedingRequest, allRequests] = await Promise.all([
    listStaysNeedingRequest(orgId),
    listReviewRequests(orgId),
  ]);

  // Batch-load unresolved issue counts for all relevant property IDs.
  const allPropertyIds = Array.from(
    new Set([
      ...staysNeedingRequest.map((s) => s.propertyId),
      ...allRequests.map((r) => r.propertyId),
    ]),
  );
  const issueCounts = await unresolvedIssueCountsByProperty(allPropertyIds);

  // Stats
  const draftCount = allRequests.filter((r) => r.status === "DRAFT" || r.status === "READY").length;
  const sentCount = allRequests.filter((r) => r.status === "SENT").length;
  const completedCount = allRequests.filter((r) => r.status === "COMPLETED").length;

  // Group requests by status for display
  const draftRequests = allRequests.filter((r) => r.status === "DRAFT" || r.status === "READY");
  const sentRequests = allRequests.filter((r) => r.status === "SENT");
  const completedRequests = allRequests.filter((r) => r.status === "COMPLETED");

  return (
    <>
      <PageHeader
        title="Review assistant"
        description="Manage guest review requests and your host reviews. AI drafts are always editable before sending."
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stays needing request"
          value={staysNeedingRequest.length}
          icon={Star}
          hint="Checked out, no request yet"
        />
        <StatCard
          label="Draft / ready"
          value={draftCount}
          icon={Star}
          hint="Being prepared"
        />
        <StatCard
          label="Sent"
          value={sentCount}
          icon={Star}
          hint="Awaiting guest review"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={Star}
          hint="Guest review received"
        />
      </div>

      {/* Stays pending a request */}
      {staysNeedingRequest.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            Recent stays — no request yet ({staysNeedingRequest.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {staysNeedingRequest.map((stay) => (
              <PendingStayCard
                key={stay.id}
                stay={stay}
                unresolvedIssues={issueCounts[stay.propertyId] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Draft / ready requests */}
      {draftRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">In progress ({draftRequests.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {draftRequests.map((req) => (
              <ReviewRequestCard
                key={req.id}
                request={req}
                unresolvedIssues={issueCounts[req.propertyId] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent requests */}
      {sentRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Sent — awaiting response ({sentRequests.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sentRequests.map((req) => (
              <ReviewRequestCard
                key={req.id}
                request={req}
                unresolvedIssues={issueCounts[req.propertyId] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed requests */}
      {completedRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Completed ({completedRequests.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {completedRequests.map((req) => (
              <ReviewRequestCard
                key={req.id}
                request={req}
                unresolvedIssues={issueCounts[req.propertyId] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state when nothing at all */}
      {staysNeedingRequest.length === 0 &&
        allRequests.length === 0 && (
          <EmptyState
            icon={Star}
            title="No review activity yet"
            description="Once guests check out, they'll appear here. You can prepare a review request message and draft your own guest review before sending."
          />
        )}
    </>
  );
}
