import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, ROLE_LABELS } from "@/lib/rbac";
import { canInviteMember } from "@/lib/usage";
import { formatDate, initials } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MemberRoleSelect } from "@/components/team/member-role-select";
import { RemoveMemberButton } from "@/components/team/remove-member-button";
import { PendingInvitations } from "@/components/team/pending-invitations";
import type { PendingInvitation } from "@/components/team/pending-invitations";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const orgId = ctx.organization.id;
  const plan = ctx.organization.subscription?.plan ?? "TRIAL";

  const canManage = can(ctx.role, "members:manage");

  const [members, invitations, limitCheck] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: orgId, status: { in: ["PENDING"] } },
      orderBy: { createdAt: "desc" },
    }),
    canInviteMember(orgId, plan),
  ]);

  const ownerCount = members.filter((m) => m.role === "OWNER").length;
  const pendingInvitations: PendingInvitation[] = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  }));

  return (
    <>
      <PageHeader
        title="Team"
        description="Manage who has access to your organisation and their roles."
      >
        {canManage && (
          <InviteMemberDialog
            planLimitReached={!limitCheck.allowed}
            planLimitReason={limitCheck.reason}
          />
        )}
      </PageHeader>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Team members"
          value={members.length}
          icon={Users}
          hint={limitCheck.limit !== null ? `${limitCheck.limit} on your plan` : "Unlimited"}
        />
        <StatCard
          label="Pending invitations"
          value={pendingInvitations.length}
          icon={Users}
        />
        <StatCard
          label="Owners"
          value={ownerCount}
          icon={Users}
        />
      </div>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Current team members and their permission level.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={Users} title="No members yet" />
            </div>
          ) : (
            <div className="divide-y">
              {members.map((member) => {
                const isLastOwner = member.role === "OWNER" && ownerCount <= 1;
                const isSelf = member.userId === ctx.user.id;

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center gap-3 px-6 py-4"
                  >
                    {/* Avatar */}
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback>
                        {initials(member.user.name ?? member.user.email)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.user.name ?? member.user.email}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      {member.user.name && (
                        <p className="truncate text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDate(member.createdAt)}
                      </p>
                    </div>

                    {/* Role select */}
                    {canManage ? (
                      <MemberRoleSelect
                        memberId={member.id}
                        currentRole={member.role}
                        disabled={isLastOwner && isSelf}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {ROLE_LABELS[member.role]}
                      </span>
                    )}

                    {/* Remove */}
                    {canManage && (
                      <RemoveMemberButton
                        memberId={member.id}
                        memberName={member.user.name ?? member.user.email}
                        disabled={isLastOwner}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {(pendingInvitations.length > 0 || canManage) && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <PendingInvitations
                invitations={pendingInvitations}
                canManage={canManage}
              />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
