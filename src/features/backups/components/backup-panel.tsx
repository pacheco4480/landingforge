import type { Backup, User } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/data-display";
import { Badge, Status } from "@/components/ui/feedback";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { createManualBackupAction } from "@/features/backups/actions/backup.actions";

type BackupRow = Backup & {
  createdByUser: Pick<User, "name" | "email"> | null;
};

export function BackupPanel({
  backups,
  canCreate,
  summary,
}: {
  backups: BackupRow[];
  canCreate: boolean;
  summary: {
    failedBackups: number;
    lastBackup: Backup | null;
    totalBackups: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backups</CardTitle>
        <CardDescription>
          Snapshots logicos para recuperacao operacional. Restore completo fica
          fora desta task.
        </CardDescription>
      </CardHeader>
      <Grid className="md:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="mt-1 text-2xl font-semibold">{summary.totalBackups}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Falhados</p>
          <p className="mt-1 text-2xl font-semibold">{summary.failedBackups}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Ultimo estado</p>
          <div className="mt-2">
            <Status
              tone={
                summary.lastBackup?.status === "FAILED" ? "error" : "success"
              }
            >
              {summary.lastBackup?.status ?? "Sem backup"}
            </Status>
          </div>
        </div>
      </Grid>
      {canCreate ? (
        <ActionFeedbackForm
          action={createManualBackupAction}
          className="mt-5"
          loadingMessage="A criar backup..."
          successMessage="Backup criado."
        >
          <Button type="submit">Criar backup manual</Button>
        </ActionFeedbackForm>
      ) : null}
      <div className="mt-6">
        <Table
          caption="Histórico de backups"
          className="min-w-[700px]"
          scrollHint="Use as setas do teclado ou deslize horizontalmente para consultar todas as colunas."
          scrollRegionLabel="Tabela de backups, deslocável horizontalmente"
        >
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="py-2 pr-3 font-medium" scope="col">
                Data
              </th>
              <th className="py-2 pr-3 font-medium" scope="col">
                Tipo
              </th>
              <th className="py-2 pr-3 font-medium" scope="col">
                Estado
              </th>
              <th className="py-2 pr-3 font-medium" scope="col">
                Tamanho
              </th>
              <th className="py-2 pr-3 font-medium" scope="col">
                Criado por
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {backups.map((backup) => (
              <tr key={backup.id}>
                <td className="py-3 pr-3">
                  {new Intl.DateTimeFormat("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(backup.createdAt)}
                </td>
                <td className="py-3 pr-3">
                  <Badge>{backup.type.toLowerCase()}</Badge>
                </td>
                <td className="py-3 pr-3">{backup.status.toLowerCase()}</td>
                <td className="py-3 pr-3">{formatBytes(backup.sizeBytes)}</td>
                <td className="py-3 pr-3">
                  {backup.createdByUser?.email ?? "Sistema"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

function formatBytes(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
