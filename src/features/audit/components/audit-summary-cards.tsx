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
    <Grid className="min-w-0 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
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
