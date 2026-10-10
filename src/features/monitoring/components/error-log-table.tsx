import type {
  SystemErrorLog,
  SystemLogLevel,
  SystemLogSource,
  User,
} from "@/generated/prisma/client";
import { Badge } from "@/components/ui/feedback";
import { DataTable, EmptyState } from "@/components/ui/data-display";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";

type ErrorLogRow = SystemErrorLog & {
  user: Pick<User, "name" | "email"> | null;
};

export function ErrorLogTable({ logs }: { logs: ErrorLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos Erros</CardTitle>
        <CardDescription>
          Eventos operacionais sanitizados. Dados sensíveis não são guardados.
        </CardDescription>
      </CardHeader>
      {logs.length === 0 ? (
        <EmptyState
          title="Sem erros registados"
          description="Quando ocorrerem falhas relevantes, aparecem aqui."
        />
      ) : (
        <DataTable
          caption="Últimos erros operacionais"
          columns={["Data", "Nível", "Origem", "Mensagem", "Ação", "Utilizador"]}
          rows={logs.map((log) => [
            formatDate(log.createdAt),
            <Badge key="level" tone={levelTone(log.level)}>
              {levelLabel(log.level)}
            </Badge>,
            <Badge key="source">{sourceLabel(log.source)}</Badge>,
            <span className="block max-w-sm truncate" key="message">
              {log.message}
            </span>,
            log.action ?? "-",
            log.user ? `${log.user.name} (${log.user.email})` : "Sistema",
          ])}
        />
      )}
    </Card>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function levelTone(level: SystemLogLevel) {
  if (level === "CRITICAL" || level === "ERROR") return "error";
  if (level === "WARNING") return "warning";
  return "info";
}

function levelLabel(level: SystemLogLevel) {
  const labels: Record<SystemLogLevel, string> = {
    INFO: "Info",
    WARNING: "Aviso",
    ERROR: "Erro",
    CRITICAL: "Crítico",
  };
  return labels[level];
}

function sourceLabel(source: SystemLogSource) {
  return source.toLowerCase();
}
