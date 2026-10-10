import { StatCard } from "@/components/ui/data-display";
import { Grid } from "@/components/ui/layout";

export function AuditSummaryCards({
  summary,
  totalFiltered,
}: {
  summary: {
    total: number;
    last24h: number;
    latest: { action: string; createdAt: Date } | null;
  };
  totalFiltered: number;
}) {
  return (
    <Grid className="md:grid-cols-4">
      <StatCard label="Logs totais" value={String(summary.total)} />
      <StatCard label="Ultimas 24h" value={String(summary.last24h)} />
      <StatCard label="Resultados filtrados" value={String(totalFiltered)} />
      <StatCard
        label="Ultima acao"
        value={summary.latest ? summary.latest.action : "Sem atividade"}
      />
    </Grid>
  );
}
