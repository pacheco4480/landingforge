import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Card, Stack } from "@/components/ui/layout";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { CopyProspectDraft } from "@/features/prospects/components/copy-prospect-draft";
import { DeleteProspectButton } from "@/features/prospects/components/delete-prospect-button";
import { ProspectForm, prospectStatusLabels } from "@/features/prospects/components/prospect-form";
import { convertProspectAction, suppressProspectAction, updateProspectStatusAction } from "@/features/prospects/actions/prospect.actions";
import { getProspectDetail, listProspectTemplates } from "@/features/prospects/services/prospect.service";
import { ProspectStatus, ProspectSuppressionType } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Ficha de prospect | LandingForge", robots: { index: false, follow: false } };

export default async function ProspectDetailPage({ params, searchParams }: { params: Promise<{ prospectId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePermission(permissions.prospectsRead);
  const [{ prospectId }, query] = await Promise.all([params, searchParams]);
  const prospect = await getProspectDetail(prospectId);
  if (!prospect) notFound();
  const canWrite = user.permissions.includes(permissions.prospectsWrite);
  const templates = canWrite ? await listProspectTemplates() : [];
  const canCompose = canWrite && prospect.status !== ProspectStatus.DO_NOT_CONTACT && prospect.status !== ProspectStatus.NOT_INTERESTED && Boolean(prospect.email);

  return <div className="grid gap-6">
    <Link href="/prospects" className="text-primary text-sm underline-offset-4 hover:underline">← Voltar a prospects</Link>
    <CmsPageHeader eyebrow="Ficha interna" title={prospect.businessName} description="Dados, proveniência, estado, rascunhos e ligação explícita ao CRM." />
    {prospect.status === ProspectStatus.DO_NOT_CONTACT ? <Alert tone="error" title="Contacto suprimido">A supressão impede a criação/exportação de mensagens. Para corrigir uma supressão, segue o processo operacional aprovado; não alteres apenas o estado.</Alert> : null}
    {query.draftSaved ? <Alert tone="success" title="Rascunho guardado">Revê o rascunho abaixo antes de o copiar.</Alert> : null}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="grid content-start gap-6">{canWrite ? <ProspectForm prospect={prospect} /> : <Card><Stack><h2 className="font-semibold">Dados do prospect</h2><p>{prospect.contactName || "Sem contacto profissional registado"} · {prospect.email || "Sem email"}</p><p>{prospect.industry || "Setor não indicado"} · {prospect.locality || "Zona não indicada"}</p><p>{prospect.factualNotes || "Sem observações factuais."}</p></Stack></Card>}
        <Card><Stack>
          <h2 className="font-semibold">Rascunhos preparados</h2>
          {prospect.outreachDrafts.length ? prospect.outreachDrafts.map((draft) => <details key={draft.id} className="border-border border-t py-4"><summary className="cursor-pointer font-medium">{draft.subjectSnapshot} · {draft.updatedAt.toLocaleDateString("pt-PT")}{draft.manualExportedAt ? " · copiado" : ""}</summary><div className="mt-4 grid gap-4"><p className="text-muted-foreground text-sm">Para: {draft.recipient || "Sem destinatário"}</p><pre className="bg-muted overflow-x-auto whitespace-pre-wrap rounded-md p-4 text-sm">{draft.bodySnapshot}</pre>{canWrite ? <CopyProspectDraft draftId={draft.id} recipient={draft.recipient} subject={draft.subjectSnapshot} body={draft.bodySnapshot} /> : null}</div></details>) : <p className="text-muted-foreground text-sm">Ainda não foram preparados rascunhos.</p>}
        </Stack></Card>
      </div>
      <aside className="grid content-start gap-4">
        {canWrite ? <Card><Stack><h2 className="font-semibold">Remover prospect</h2><p className="text-muted-foreground text-sm">A remoção elimina também os rascunhos associados. Uma supressão global, se existir, permanece ativa.</p><DeleteProspectButton id={prospect.id} /></Stack></Card> : null}
        <Card><Stack><h2 className="font-semibold">Estado e seguimento</h2><Badge tone={prospect.status === ProspectStatus.DO_NOT_CONTACT ? "error" : "neutral"}>{prospectStatusLabels[prospect.status]}</Badge>{prospect.nextFollowUpAt ? <p className="text-sm">Seguimento previsto: {prospect.nextFollowUpAt.toISOString().slice(0, 10)}</p> : null}{canWrite && prospect.status !== ProspectStatus.DO_NOT_CONTACT ? <form action={updateProspectStatusAction} className="grid gap-3"><input type="hidden" name="id" value={prospect.id} /><Field><Label htmlFor="next-status">Alterar estado</Label><Select id="next-status" name="status" defaultValue={prospect.status}>{Object.values(ProspectStatus).filter((status) => status !== ProspectStatus.DO_NOT_CONTACT).map((status) => <option key={status} value={status}>{prospectStatusLabels[status]}</option>)}</Select></Field><Button variant="secondary">Guardar estado</Button></form> : null}</Stack></Card>
        <Card><Stack><h2 className="font-semibold">Proveniência</h2><p className="text-sm">Origem: {prospect.sourceType === "CSV" ? "Importação CSV" : prospect.sourceType === "ASSISTED" ? "Pesquisa assistida" : "Registo manual"}</p><p className="text-sm">Recolhido: {prospect.collectedAt.toLocaleDateString("pt-PT")}</p><p className="text-sm">Verificado: {prospect.verifiedAt?.toLocaleDateString("pt-PT") ?? "Não indicado"}</p>{prospect.sourceUrl ? <a className="text-primary break-all text-sm underline" href={prospect.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte pública</a> : <p className="text-warning text-sm">Falta URL de fonte verificável.</p>}{prospect.website ? <a className="text-primary break-all text-sm underline" href={prospect.website} target="_blank" rel="noreferrer">Website da empresa</a> : null}</Stack></Card>
        {canCompose ? <Card><Stack><h2 className="font-semibold">Preparar contacto individual</h2><p className="text-muted-foreground text-sm">Sem envio automático. Escolhe um modelo editável e confirma factos e adequação antes de copiar.</p>{templates.length ? templates.map((template) => <Link className="text-primary text-sm underline-offset-4 hover:underline" key={template.id} href={`/prospects/${prospect.id}/outreach?template=${template.id}`}>Usar: {template.name} · v{template.versions[0]?.version ?? 0}</Link>) : <Link className="text-primary text-sm underline-offset-4 hover:underline" href="/prospects/templates">Criar primeiro modelo de email</Link>}</Stack></Card> : null}
        {prospect.status !== ProspectStatus.DO_NOT_CONTACT && canWrite && (prospect.email || prospect.website) ? <Card><Stack><h2 className="font-semibold">Não contactar</h2><p className="text-muted-foreground text-sm">Adiciona o email ou domínio à lista global de supressão. A ação propaga-se aos prospects já conhecidos.</p>{prospect.email ? <form action={suppressProspectAction} className="grid gap-2"><input type="hidden" name="prospectId" value={prospect.id} /><input type="hidden" name="type" value={ProspectSuppressionType.EMAIL} /><input type="hidden" name="value" value={prospect.email} /><Field><Label htmlFor="email-reason">Motivo da supressão do email</Label><Input id="email-reason" name="reason" required maxLength={300} defaultValue="Pedido de não contacto" /></Field><Button variant="destructive">Suprimir email</Button></form> : null}{prospect.website ? <form action={suppressProspectAction} className="grid gap-2"><input type="hidden" name="prospectId" value={prospect.id} /><input type="hidden" name="type" value={ProspectSuppressionType.DOMAIN} /><input type="hidden" name="value" value={prospect.website} /><Field><Label htmlFor="domain-reason">Motivo da supressão do domínio</Label><Input id="domain-reason" name="reason" required maxLength={300} defaultValue="Pedido de não contacto" /></Field><Button variant="destructive">Suprimir domínio</Button></form> : null}</Stack></Card> : null}
        {!prospect.convertedClient && prospect.status !== ProspectStatus.DO_NOT_CONTACT && canWrite ? <Card><Stack><h2 className="font-semibold">Promover para CRM</h2><p className="text-muted-foreground text-sm">Associa um Client existente por email/domínio ou cria um Client. Não cria um Lead de formulário.</p><form action={convertProspectAction}><input type="hidden" name="id" value={prospect.id} /><Button variant="outline">Associar / criar Client</Button></form></Stack></Card> : prospect.convertedClient ? <Card><Stack><h2 className="font-semibold">Cliente associado</h2><Link className="text-primary underline" href={`/clients/${prospect.convertedClient.id}`}>{prospect.convertedClient.businessName}</Link></Stack></Card> : null}
      </aside>
    </div>
  </div>;
}
