import Link from "next/link";

import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, CardDescription, CardHeader, CardTitle, Grid } from "@/components/ui/layout";
import { PrivacyRequestStatus, PrivacyRequestType } from "@/generated/prisma/client";
import {
  createPrivacyRequestAction,
  updatePrivacyRequestAction,
  updateRetentionPolicyAction,
} from "@/features/privacy/actions/privacy.actions";
import { defaultPrivacyRequestDueDate, maximumPrivacyRequestDueDate } from "@/features/privacy/privacy-workflow";

const requestTypeLabels: Record<PrivacyRequestType, string> = {
  [PrivacyRequestType.ACCESS]: "Acesso",
  [PrivacyRequestType.RECTIFICATION]: "Retificação",
  [PrivacyRequestType.ERASURE]: "Apagamento",
  [PrivacyRequestType.RESTRICTION]: "Limitação",
  [PrivacyRequestType.OBJECTION]: "Oposição",
};
const requestStatusLabels: Record<PrivacyRequestStatus, string> = {
  [PrivacyRequestStatus.RECEIVED]: "Recebido",
  [PrivacyRequestStatus.VERIFYING]: "A verificar identidade",
  [PrivacyRequestStatus.VERIFIED]: "Identidade verificada",
  [PrivacyRequestStatus.REVIEW]: "Em análise",
  [PrivacyRequestStatus.APPROVED]: "Aprovado para tratamento",
  [PrivacyRequestStatus.IN_PROGRESS]: "Em tratamento",
  [PrivacyRequestStatus.COMPLETED]: "Concluído",
  [PrivacyRequestStatus.PARTIALLY_COMPLETED]: "Parcialmente concluído",
  [PrivacyRequestStatus.DECLINED]: "Recusado",
  [PrivacyRequestStatus.CLOSED]: "Fechado",
};
const requestTypeOptions = Object.values(PrivacyRequestType);

type Workspace = Awaited<ReturnType<typeof import("@/features/privacy/services/privacy.service").getPrivacyWorkspace>>;

export function PrivacyWorkspace({ data }: { data: Workspace }) {
  return (
    <div className="grid gap-6">
      <Alert tone="warning" title="Revisão humana obrigatória">
        Os prazos são critérios operacionais aprovados para sinalizar registos, não uma certificação legal. A eliminação automática está desligada. Confirma finalidade, base aplicável, exceções contratuais/fiscais e cópias de fornecedores antes de responder ou apagar dados. Faturas e contratos contabilísticos ficam fora do CRM; leads recolhidos nos sites dos clientes seguem as instruções e o contrato de cada projeto.
      </Alert>
      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">Políticas operacionais</h2>
          <p className="text-muted-foreground mt-1 text-sm">Podes ajustar os dias e critérios mais tarde. Cada edição fica auditada; nenhuma alteração ativa um purge automático.</p>
        </div>
        <Grid className="lg:grid-cols-2">
          {data.policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <CardTitle>{policy.label}</CardTitle>
                <CardDescription>{policy.key === "uncontracted_prospect" ? "Contactos sem projeto associado e com data de contacto relevante registada." : "Dados de trabalho de projetos entregues/arquivados após o fim efetivo do serviço."}</CardDescription>
              </CardHeader>
              <ActionFeedbackForm action={updateRetentionPolicyAction} className="grid gap-4" loadingMessage="A guardar política…" successMessage="Política atualizada.">
                <input type="hidden" name="id" value={policy.id} />
                <Field>
                  <Label htmlFor={`days-${policy.id}`}>Prazo operacional (dias)</Label>
                  <Input id={`days-${policy.id}`} name="retentionDays" type="number" min={1} max={3650} required defaultValue={policy.retentionDays} />
                </Field>
                <Field>
                  <Label htmlFor={`purpose-${policy.id}`}>Finalidade</Label>
                  <Textarea id={`purpose-${policy.id}`} name="purpose" required maxLength={500} defaultValue={policy.purpose} />
                </Field>
                <Field>
                  <Label htmlFor={`basis-${policy.id}`}>Nota sobre base de licitude / revisão</Label>
                  <Textarea id={`basis-${policy.id}`} name="legalBasisNote" required maxLength={500} defaultValue={policy.legalBasisNote} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox name="enabled" defaultChecked={policy.enabled} /> Incluir na fila de revisão
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit">Guardar política</Button>
                  <Badge tone="neutral">Automação: desligada</Badge>
                  <Badge tone={policy.legalReviewedAt ? "success" : "warning"}>{policy.legalReviewedAt ? "Revisão profissional registada" : "Revisão profissional pendente"}</Badge>
                </div>
              </ActionFeedbackForm>
            </Card>
          ))}
        </Grid>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">Registos para rever</h2>
          <p className="text-muted-foreground mt-1 text-sm">A inclusão na fila não determina que os dados devam ser apagados. Verifica contratos, obrigações e eventuais pedidos de conservação.</p>
        </div>
        <Card>
          <h3 className="font-semibold">Contactos de prospeção</h3>
          {data.retentionCandidates.prospects.length ? (
            <ul className="divide-border mt-3 divide-y">
              {data.retentionCandidates.prospects.map((item) => <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={item.id}><Link className="underline-offset-4 hover:underline" href={`/clients/${item.id}`}>{item.businessName}</Link><span className="text-muted-foreground">Último contacto: {dateLabel(item.lastMeaningfulContactAt)} · {item.status}</span></li>)}
            </ul>
          ) : <p className="text-muted-foreground mt-2 text-sm">Sem contactos que cumpram os critérios registados.</p>}
        </Card>
        <Card>
          <h3 className="font-semibold">Dados de trabalho de projetos</h3>
          {data.retentionCandidates.projects.length ? (
            <ul className="divide-border mt-3 divide-y">
              {data.retentionCandidates.projects.map((item) => <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={item.id}><Link className="underline-offset-4 hover:underline" href={`/projects/${item.id}`}>{item.name}</Link><span className="text-muted-foreground">{item.client.businessName} · serviço terminado: {dateLabel(item.serviceEndedAt)}</span></li>)}
            </ul>
          ) : <p className="text-muted-foreground mt-2 text-sm">Sem projetos que cumpram os critérios registados.</p>}
        </Card>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pedidos de titulares</h2>
          <p className="text-muted-foreground mt-1 text-sm">Regista apenas os dados mínimos. Não anexes documentos de identidade nem copies o conteúdo integral do pedido para o resumo.</p>
        </div>
        <NewPrivacyRequestForm clients={data.clients} projects={data.projects} />
        {data.requests.length ? data.requests.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{requestTypeLabels[request.type]} · {request.requesterName}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{request.requesterEmail} · recebido {dateLabel(request.receivedAt)}</p>
                <p className="text-muted-foreground mt-1 text-sm">{request.client?.businessName ?? "Sem cliente associado"}{request.project ? ` · ${request.project.name}` : ""}{request.dueAt ? ` · prazo registado: ${dateLabel(request.dueAt)}` : ""}</p>
              </div>
              <Badge tone={request.status === PrivacyRequestStatus.COMPLETED ? "success" : "neutral"}>{requestStatusLabels[request.status]}</Badge>
            </div>
            {request.identityVerifiedAt ? <p className="mt-3 text-sm">Identidade confirmada em {dateLabel(request.identityVerifiedAt)} através de: {request.identityVerificationMethod}</p> : null}
            {request.extensionCommunicatedAt ? <p className="text-muted-foreground mt-2 text-sm">Prorrogação comunicada em {dateLabel(request.extensionCommunicatedAt)} · canal: {extensionChannelLabel(request.extensionCommunicationChannel)}</p> : null}
            {request.decisionSummary ? <p className="text-muted-foreground mt-2 text-sm">Síntese: {request.decisionSummary}</p> : null}
            {request.type === PrivacyRequestType.ACCESS && request.status === PrivacyRequestStatus.APPROVED ? <p className="mt-3"><Link className="text-primary text-sm font-medium underline-offset-4 hover:underline" href={`/privacy/requests/${request.id}/export`}>Transferir pré-visualização estruturada para revisão</Link></p> : null}
            {request.nextStatuses.length ? <RequestUpdateForm requestId={request.id} nextStatuses={request.nextStatuses} receivedAt={request.receivedAt} dueAt={request.dueAt} extensionCommunicatedAt={request.extensionCommunicatedAt} extensionCommunicationChannel={request.extensionCommunicationChannel} /> : null}
          </Card>
        )) : <p className="text-muted-foreground text-sm">Ainda não existem pedidos registados.</p>}
      </section>
    </div>
  );
}
function NewPrivacyRequestForm({ clients, projects }: { clients: Workspace["clients"]; projects: Workspace["projects"] }) {
  const defaultDueAt = dateInputValue(defaultPrivacyRequestDueDate(new Date()));
  return (
    <Card>
      <CardHeader><CardTitle>Registar pedido</CardTitle><CardDescription>O conteúdo detalhado e a documentação de identidade não são guardados neste registo.</CardDescription></CardHeader>
      <ActionFeedbackForm action={createPrivacyRequestAction} className="grid gap-4" loadingMessage="A registar pedido…" successMessage="Pedido registado.">
        <Grid className="md:grid-cols-2 lg:grid-cols-3">
          <Field><Label htmlFor="request-type">Tipo</Label><Select id="request-type" name="type" defaultValue={PrivacyRequestType.ACCESS}>{requestTypeOptions.map((type) => <option key={type} value={type}>{requestTypeLabels[type]}</option>)}</Select></Field>
          <Field><Label htmlFor="request-name">Nome do titular</Label><Input id="request-name" name="requesterName" maxLength={160} required /></Field>
          <Field><Label htmlFor="request-email">Email de contacto fornecido</Label><Input id="request-email" name="requesterEmail" type="email" maxLength={254} required /></Field>
          <Field><Label htmlFor="request-client">Cliente relacionado</Label><Select id="request-client" name="clientId" defaultValue=""><option value="">Sem associação</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}</Select></Field>
          <Field><Label htmlFor="request-project">Projeto relacionado</Label><Select id="request-project" name="projectId" defaultValue=""><option value="">Sem associação</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></Field>
          <Field><Label htmlFor="request-due">Prazo de resposta</Label><Input id="request-due" name="dueAt" type="date" min={dateInputValue(new Date())} max={defaultDueAt} defaultValue={defaultDueAt} /><p className="text-muted-foreground text-xs">Referência: um mês após a receção. Uma prorrogação é registada no passo seguinte, com motivo e prova da comunicação.</p></Field>
        </Grid>
        <Button type="submit">Registar pedido</Button>
      </ActionFeedbackForm>
    </Card>
  );
}

function RequestUpdateForm({ requestId, nextStatuses, receivedAt, dueAt, extensionCommunicatedAt, extensionCommunicationChannel }: { requestId: string; nextStatuses: PrivacyRequestStatus[]; receivedAt: Date; dueAt: Date | null; extensionCommunicatedAt: Date | null; extensionCommunicationChannel: string | null }) {
  const maximumDueAt = dateInputValue(maximumPrivacyRequestDueDate(receivedAt));
  const initialDueAt = dateInputValue(defaultPrivacyRequestDueDate(receivedAt));
  return (
    <ActionFeedbackForm action={updatePrivacyRequestAction} className="mt-5 grid gap-4 border-t pt-4" loadingMessage="A atualizar pedido…" successMessage="Estado do pedido atualizado.">
      <input type="hidden" name="id" value={requestId} />
      <Grid className="md:grid-cols-2 lg:grid-cols-3">
        <Field><Label htmlFor={`next-${requestId}`}>Próximo estado</Label><Select id={`next-${requestId}`} name="status" required>{nextStatuses.map((status) => <option key={status} value={status}>{requestStatusLabels[status]}</option>)}</Select></Field>
        <Field><Label htmlFor={`verify-${requestId}`}>Canal de verificação da identidade</Label><Input id={`verify-${requestId}`} name="identityVerificationMethod" maxLength={160} placeholder="Ex.: contacto num endereço já conhecido" /></Field>
        <Field><Label htmlFor={`summary-${requestId}`}>Síntese / motivo da alteração</Label><Input id={`summary-${requestId}`} name="decisionSummary" maxLength={1000} placeholder="Não incluas dados pessoais desnecessários" /></Field>
        <Field><Label htmlFor={`due-${requestId}`}>Prazo de resposta</Label><Input id={`due-${requestId}`} name="dueAt" type="date" min={dateInputValue(receivedAt)} max={maximumDueAt} defaultValue={dateInputValue(dueAt)} /><p className="text-muted-foreground text-xs">Uma data posterior ao prazo inicial exige motivo, canal e data da comunicação ao titular; máximo operacional de dois meses adicionais.</p></Field>
        <Field><Label htmlFor={`extension-date-${requestId}`}>Data da comunicação da prorrogação</Label><Input id={`extension-date-${requestId}`} name="extensionCommunicatedAt" type="date" max={initialDueAt} defaultValue={dateInputValue(extensionCommunicatedAt)} /><p className="text-muted-foreground text-xs">Regista a data real; tem de ser até ao prazo inicial.</p></Field>
        <Field><Label htmlFor={`extension-channel-${requestId}`}>Canal da comunicação</Label><Select id={`extension-channel-${requestId}`} name="extensionCommunicationChannel" defaultValue={extensionCommunicationChannel ?? ""}><option value="">Não aplicável</option><option value="email">Email</option><option value="phone">Telefone</option><option value="secure_channel">Canal seguro</option><option value="other">Outro canal documentado</option></Select><p className="text-muted-foreground text-xs">Regista apenas o tipo de canal, nunca o endereço ou conteúdo da mensagem.</p></Field>
      </Grid>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit">Atualizar pedido</Button><p className="text-muted-foreground text-xs">A aprovação não apaga dados nem certifica identidade. A exportação disponível é apenas uma pré-visualização sujeita a revisão manual.</p></div>
    </ActionFeedbackForm>
  );
}

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "UTC" }).format(value) : "—";
}

function dateInputValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function extensionChannelLabel(value: string | null) {
  switch (value) {
    case "email": return "email";
    case "phone": return "telefone";
    case "secure_channel": return "canal seguro";
    case "other": return "outro canal documentado";
    default: return "não indicado";
  }
}
