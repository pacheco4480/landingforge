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
    <Grid className="md:grid-cols-5">
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
