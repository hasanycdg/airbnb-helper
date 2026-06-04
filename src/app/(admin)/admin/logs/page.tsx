import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuditLogs } from "@/server/admin";

function actionBadgeVariant(
  action: string,
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (action.startsWith("admin.")) return "destructive";
  if (action.endsWith(".delete")) return "warning";
  if (action.endsWith(".create")) return "success";
  return "secondary";
}

export default async function AdminLogsPage() {
  const logs = await getAuditLogs();

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description={`Last ${logs.length} audit entries, newest first.`}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit logs yet"
          description="Audit events will appear here as users and admins take actions."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Organization
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {log.createdAt.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.actorEmail ? (
                          <div>
                            <div className="font-medium">{log.actorName ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.orgName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.targetType ? (
                          <div>
                            <span className="font-medium">{log.targetType}</span>
                            {log.targetId && (
                              <span className="ml-1 font-mono text-xs text-muted-foreground">
                                {log.targetId.slice(0, 12)}…
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
