import { StatCard } from "@/components/ui/data-display";
import { Grid } from "@/components/ui/layout";

export function MonitoringSummaryCards({
  summary,
}: {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    last24h: number;
    failedEmails: number;
    securityBlocked24h: number;
  };
}) {
  return (
    <Grid className="min-w-0 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(5,minmax(0,1fr))]">
      <StatCard label="Erros totais" value={String(summary.totalErrors)} />
      <StatCard
        label="Críticos"
        value={String(summary.criticalErrors)}
        helper="Requerem atenção prioritária"
      />
      <StatCard label="Últimas 24h" value={String(summary.last24h)} />
      <StatCard label="Emails falhados" value={String(summary.failedEmails)} />
      <StatCard
        label="Segurança 24h"
        value={String(summary.securityBlocked24h)}
      />
    </Grid>
  );
}
