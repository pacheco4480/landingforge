import type { LeadStatus } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState } from "@/components/ui/data-display";
import { Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";
import { updateLeadStatusAction } from "@/features/leads/actions/lead.actions";
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge";
import {
  leadStatusLabels,
  leadStatusOrder,
} from "@/features/leads/services/lead-status.service";

type LeadTableRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  createdAt: Date;
  formSubmission: {
    form: { name: string } | null;
    page: { title: string; slug: string } | null;
  } | null;
  _count: { notes: number };
};

export function LeadsTable({
  leads,
  canWrite,
}: {
  leads: LeadTableRow[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
        <CardDescription>
          Lista operacional de contactos captados nas landing pages.
        </CardDescription>
      </CardHeader>
      {leads.length === 0 ? (
        <EmptyState
          title="Sem leads"
          description="Quando os formulários receberem submissões, os leads aparecem aqui."
        />
      ) : (
        <DataTable
          columns={[
            "Contacto",
            "Origem",
            "Estado",
            "Data",
            "Notas",
            "Ações",
          ]}
          rows={leads.map((lead) => [
            <a className="font-medium" href={`/leads?leadId=${lead.id}`} key="contact">
              {lead.name ?? "Sem nome"}
              <span className="text-muted-foreground block text-xs">
                {[lead.email, lead.phone].filter(Boolean).join(" · ") ||
                  "Sem contacto direto"}
              </span>
            </a>,
            <span key="source">
              {lead.source ?? lead.formSubmission?.form?.name ?? "Manual"}
              {lead.formSubmission?.page ? (
                <span className="text-muted-foreground block text-xs">
                  /{lead.formSubmission.page.slug}
                </span>
              ) : null}
            </span>,
            <LeadStatusBadge key="status" status={lead.status} />,
            lead.createdAt.toLocaleString("pt-PT"),
            lead._count.notes,
            canWrite ? (
              <ActionFeedbackForm
                action={updateLeadStatusAction}
                className="flex flex-wrap items-center gap-2"
                loadingMessage="A atualizar lead..."
                successMessage="Lead atualizado."
                key="actions"
              >
                <input name="id" type="hidden" value={lead.id} />
                <Select
                  className="min-h-9 w-40 text-xs"
                  name="status"
                  defaultValue={lead.status}
                  aria-label="Alterar estado"
                >
                  {leadStatusOrder.map((status) => (
                    <option key={status} value={status}>
                      {leadStatusLabels[status]}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="outline" size="sm">
                  Guardar
                </Button>
              </ActionFeedbackForm>
            ) : (
              "Só leitura"
            ),
          ])}
        />
      )}
    </Card>
  );
}
