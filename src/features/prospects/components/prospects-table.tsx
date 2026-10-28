import Link from "next/link";

import { EmptyState, Table } from "@/components/ui/data-display";
import { Badge } from "@/components/ui/feedback";
import { prospectStatusLabels } from "@/features/prospects/components/prospect-form";
import type { ProspectStatus } from "@/generated/prisma/client";

type ProspectRow = {
  id: string; businessName: string; contactName: string | null; email: string | null;
  industry: string | null; locality: string | null; website: string | null;
  status: ProspectStatus; updatedAt: Date; sourceType: string;
  convertedClient: { id: string; businessName: string } | null;
};

export function ProspectsTable({ prospects, hasFilters }: { prospects: ProspectRow[]; hasFilters: boolean }) {
  if (!prospects.length) return <EmptyState title={hasFilters ? "Sem resultados" : "Ainda não existem prospects"} description={hasFilters ? "Altera os filtros para procurar noutros registos." : "Regista manualmente uma empresa ou importa um CSV para iniciar a prospeção."} />;
  return (
    <Table caption="Prospects B2B internos">
      <thead className="border-border text-muted-foreground border-b text-xs uppercase"><tr>
        <th scope="col" className="px-3 py-2">Empresa</th><th scope="col" className="px-3 py-2">Contacto</th><th scope="col" className="px-3 py-2">Nicho / zona</th><th scope="col" className="px-3 py-2">Estado</th><th scope="col" className="px-3 py-2">Origem</th><th scope="col" className="px-3 py-2">Atualizado</th>
      </tr></thead>
      <tbody>{prospects.map((prospect) => <tr key={prospect.id} className="border-border border-b last:border-0">
        <td className="px-3 py-3"><Link className="font-semibold underline-offset-4 hover:underline" href={`/prospects/${prospect.id}`}>{prospect.businessName}</Link>{prospect.convertedClient ? <p className="text-muted-foreground mt-1 text-xs">CRM: {prospect.convertedClient.businessName}</p> : null}</td>
        <td className="px-3 py-3 text-sm">{prospect.contactName || "—"}<div className="text-muted-foreground">{prospect.email || "Sem email"}</div></td>
        <td className="px-3 py-3 text-sm">{prospect.industry || "—"}<div className="text-muted-foreground">{prospect.locality || "—"}</div></td>
        <td className="px-3 py-3"><Badge tone={prospect.status === "DO_NOT_CONTACT" ? "error" : prospect.status === "INTERESTED" || prospect.status === "CONVERTED" ? "success" : "neutral"}>{prospectStatusLabels[prospect.status]}</Badge></td>
        <td className="px-3 py-3 text-sm">{prospect.sourceType === "CSV" ? "CSV" : prospect.sourceType === "ASSISTED" ? "API" : "Manual"}</td>
        <td className="text-muted-foreground px-3 py-3 text-sm">{prospect.updatedAt.toLocaleDateString("pt-PT")}</td>
      </tr>)}</tbody>
    </Table>
  );
}
