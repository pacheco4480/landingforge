import type { AuditLog, User } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/feedback";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";

type AuditLogRow = AuditLog & {
  user: Pick<User, "id" | "name" | "email"> | null;
};

export function AuditTable({ logs }: { logs: AuditLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Ultimas acoes registadas. Os registos sao imutaveis na base de dados.
        </CardDescription>
      </CardHeader>
      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sem logs para estes filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Acao</th>
                <th className="py-2 pr-3 font-medium">Entidade</th>
                <th className="py-2 pr-3 font-medium">Utilizador</th>
                <th className="py-2 pr-3 font-medium">IP</th>
                <th className="py-2 pr-3 font-medium">Alteracoes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-3 align-top">
                    {new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(log.createdAt)}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <span className="font-medium">{log.action}</span>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <div className="grid gap-1">
                      <Badge>{log.entityType}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {log.entityId ?? "Sem ID"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    {log.user ? (
                      <div>
                        <p>{log.user.name}</p>
                        <p className="text-muted-foreground text-xs">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sistema</span>
                    )}
                  </td>
                  <td className="text-muted-foreground py-3 pr-3 align-top">
                    {log.ipAddress ?? "-"}
                  </td>
                  <td className="text-muted-foreground py-3 pr-3 align-top">
                    {log.oldValues || log.newValues ? "Sim" : "Nao"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
