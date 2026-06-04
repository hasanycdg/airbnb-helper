import { ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllUsers } from "@/server/admin";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <>
      <PageHeader
        title="Users"
        description={`${users.length} registered user${users.length === 1 ? "" : "s"} on the platform.`}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Users appear here once they sign up."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Organizations
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Super-admin
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Email verified
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {user.orgs.length === 0 ? (
                          <span className="text-muted-foreground">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.orgs.map((org) => (
                              <span
                                key={org.id}
                                className="rounded bg-muted px-1.5 py-0.5 text-xs"
                              >
                                {org.name}
                                <span className="ml-1 text-muted-foreground">·{org.role}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuperAdmin ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Super-admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.emailVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.createdAt.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
