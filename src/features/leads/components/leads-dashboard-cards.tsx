import { StatCard } from "@/components/ui/data-display";
import { Grid } from "@/components/ui/layout";

export function LeadsDashboardCards({
  metrics,
}: {
  metrics: {
    total: number;
    today: number;
    week: number;
    month: number;
    converted: number;
    conversionRate: number;
  };
}) {
  return (
    <Grid className="md:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total" value={String(metrics.total)} />
      <StatCard label="Hoje" value={String(metrics.today)} />
      <StatCard label="Semana" value={String(metrics.week)} />
      <StatCard label="Mês" value={String(metrics.month)} />
      <StatCard label="Convertidos" value={String(metrics.converted)} />
      <StatCard label="Conversão" value={`${metrics.conversionRate}%`} />
    </Grid>
  );
}
