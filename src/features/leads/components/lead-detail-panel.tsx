import type { LeadStatus } from "@/generated/prisma/client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { LeadActivityTimeline } from "@/features/leads/components/lead-activity-timeline";
import { LeadNotes } from "@/features/leads/components/lead-notes";
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge";

type SelectedLead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  createdAt: Date;
  firstSeenAt: Date;
  lastContactedAt: Date | null;
  convertedAt: Date | null;
  lostAt: Date | null;
  notes: Array<{
    id: string;
    leadId: string;
    note: string;
    createdAt: Date;
    user: { name: string | null; email: string } | null;
  }>;
  formSubmission: {
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    form: { id: string; name: string; key: string } | null;
    page: {
      id: string;
      title: string;
      slug: string;
      industry: { name: string } | null;
      template: { name: string } | null;
      templateVariant: { name: string } | null;
    } | null;
  } | null;
};

export function LeadDetailPanel({
  lead,
  activity,
  canWrite,
}: {
  lead: SelectedLead | null;
  activity: Array<{
    id: string;
    action: string;
    createdAt: Date;
    user: { name: string | null; email: string } | null;
  }>;
  canWrite: boolean;
}) {
  if (!lead) return null;

  return (
    <Grid className="xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>{lead.name ?? "Lead sem nome"}</CardTitle>
          <CardDescription>
            Informação principal, origem e metadados de captação.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-5">
          <LeadStatusBadge status={lead.status} />
          <dl className="grid gap-4 md:grid-cols-2">
            <Info label="Email" value={lead.email} />
            <Info label="Telefone" value={lead.phone} />
            <Info label="Empresa" value={lead.company} />
            <Info label="Origem" value={lead.source} />
            <Info label="Formulário" value={lead.formSubmission?.form?.name} />
            <Info
              label="Página"
              value={
                lead.formSubmission?.page
                  ? `${lead.formSubmission.page.title} /${lead.formSubmission.page.slug}`
                  : null
              }
            />
            <Info
              label="Indústria"
              value={lead.formSubmission?.page?.industry?.name}
            />
            <Info
              label="Template"
              value={lead.formSubmission?.page?.template?.name}
            />
            <Info
              label="Variante"
              value={lead.formSubmission?.page?.templateVariant?.name}
            />
            <Info
              label="Referência"
              value={lead.formSubmission?.referrer}
            />
            <Info label="UTM source" value={lead.formSubmission?.utmSource} />
            <Info label="UTM campaign" value={lead.formSubmission?.utmCampaign} />
          </dl>
          {lead.message ? (
            <div>
              <p className="text-sm font-semibold">Mensagem</p>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                {lead.message}
              </p>
            </div>
          ) : null}
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
          <CardDescription>
            Contexto interno para acompanhamento comercial.
          </CardDescription>
        </CardHeader>
        <LeadNotes leadId={lead.id} notes={lead.notes} canWrite={canWrite} />
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            Atividade relevante desde a criação até à conversão ou perda.
          </CardDescription>
        </CardHeader>
        <LeadActivityTimeline
          createdAt={lead.createdAt}
          convertedAt={lead.convertedAt}
          lostAt={lead.lostAt}
          activity={activity}
        />
      </Card>
    </Grid>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value || "Não definido"}</dd>
    </div>
  );
}
