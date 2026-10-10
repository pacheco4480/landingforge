import { buildLeadWhere } from "@/features/leads/services/lead-query.service";
import type { LeadFilters } from "@/features/leads/schemas/lead.schema";
import { leadStatusLabels } from "@/features/leads/services/lead-status.service";
import { toCsv } from "@/features/exports/services/csv.service";
import { db } from "@/lib/db";

export async function exportLeadsCsv(filters: LeadFilters) {
  const leads = await db.lead.findMany({
    where: buildLeadWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: {
      formSubmission: {
        include: {
          form: { select: { name: true } },
          page: { select: { title: true, slug: true } },
        },
      },
    },
  });

  const rows = [
    [
      "Nome",
      "Email",
      "Telefone",
      "Empresa",
      "Origem",
      "Estado",
      "Data",
      "Formulario",
      "Pagina",
      "Mensagem",
      "Consentimento",
      "Versao Consentimento",
      "Data Consentimento",
    ],
    ...leads.map((lead) => [
      lead.name ?? "",
      lead.email ?? "",
      lead.phone ?? "",
      lead.company ?? "",
      lead.source ?? "",
      leadStatusLabels[lead.status],
      lead.createdAt.toISOString(),
      lead.formSubmission?.form.name ?? "",
      lead.formSubmission?.page?.title ?? "",
      lead.message ?? "",
      lead.consentGiven ? "Sim" : "Nao",
      lead.consentVersion ?? "",
      lead.consentGivenAt?.toISOString() ?? "",
    ]),
  ];

  return toCsv(rows);
}
