import { FileDown } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle, Grid } from "@/components/ui/layout";

const exports = [
  ["Leads CSV", "/leads/export", "Leads filtrados e consentimentos."],
  ["Pages JSON", "/admin/export?type=pages", "Paginas, secoes e SEO."],
  ["Pages CSV", "/admin/export?type=pages&format=csv", "Resumo de paginas."],
  ["Forms JSON", "/admin/export?type=forms", "Formularios e campos."],
  ["Settings JSON", "/admin/export?type=settings", "Configuracoes operacionais."],
  ["Audit CSV", "/admin/audit/export", "Logs de auditoria."],
] as const;

export function ExportPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exports</CardTitle>
        <CardDescription>
          Exportacoes protegidas para manutencao, RGPD e operacao.
        </CardDescription>
      </CardHeader>
      <Grid className="md:grid-cols-2 xl:grid-cols-3">
        {exports.map(([title, href, description]) => (
          <a
            className="border-border bg-background hover:bg-muted rounded-md border p-4 transition-colors"
            href={href}
            key={href}
          >
            <FileDown className="text-primary size-5" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </a>
        ))}
      </Grid>
    </Card>
  );
}
