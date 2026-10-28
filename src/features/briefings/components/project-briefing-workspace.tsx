import { ClipboardList, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  applyBriefingMappedContentAction,
  createProjectAssetAction,
  createProjectMeetingAction,
  createProjectProposalAction,
  recordBriefingApprovalAction,
  requestBriefingReviewAction,
  revokeBriefingSharesAction,
  reviewProjectAssetAction,
  updateProjectProposalStatusAction,
} from "@/features/briefings/actions/briefing.actions";
import { BriefingAiContextForm } from "@/features/briefings/components/briefing-ai-context-form";
import { BriefingEditorForm } from "@/features/briefings/components/briefing-editor-form";
import { BriefingShareControl } from "@/features/briefings/components/briefing-share-control";
import { ProjectSpecificationControl } from "@/features/briefings/components/project-specification-control";
import { ProjectChecklist } from "@/features/briefings/components/project-checklist";
import { ProjectReadiness } from "@/features/briefings/components/project-readiness";
import { briefingCompletion } from "@/features/briefings/briefing-questions";
import { calculateProjectReadiness } from "@/features/briefings/project-readiness";
import {
  listProjectMediaOptions,
  listProjectWorkspaceRecords,
  getProjectBriefingWorkspace,
} from "@/features/briefings/briefing.service";
import type { BriefingActor } from "@/features/briefings/briefing.service";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em preenchimento",
  REVIEW_REQUESTED: "Revisão pedida",
  APPROVED: "Âmbito aprovado",
  ARCHIVED: "Arquivado",
};
const assetStatusLabels: Record<string, string> = {
  MISSING: "Em falta",
  RECEIVED: "Recebido",
  IN_REVIEW: "Em revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};
const proposalStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviada",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  EXPIRED: "Expirada",
};
const projectStatusLabels: Record<string, string> = {
  BRIEFING: "Briefing",
  CONTENT_COLLECTION: "Recolha de conteúdos",
  PLANNING: "Planeamento",
  DEVELOPMENT: "Desenvolvimento",
  REVIEW: "Revisão",
  APPROVED: "Aprovado",
  DELIVERED: "Entregue",
  MAINTENANCE: "Manutenção",
  ARCHIVED: "Arquivado",
};

export async function ProjectBriefingWorkspace({
  projectId,
  actor,
  canWrite,
  canUseMedia,
}: {
  projectId: string;
  actor: BriefingActor;
  canWrite: boolean;
  canUseMedia: boolean;
}) {
  const [workspace, records, mediaOptions] = await Promise.all([
    getProjectBriefingWorkspace(projectId, actor),
    listProjectWorkspaceRecords(projectId, actor),
    canUseMedia && canWrite
      ? listProjectMediaOptions(projectId, actor)
      : Promise.resolve([]),
  ]);
  const completion = briefingCompletion(
    workspace.answers,
    workspace.industryKey,
    workspace.sectionCapabilities,
    workspace.project.serviceType,
  );
  const readiness = calculateProjectReadiness(
    workspace.answers,
    records.checklist,
  );
  const grouped = workspace.questions.reduce<
    Map<string, typeof workspace.questions>
  >((groups, question) => {
    groups.set(question.group, [
      ...(groups.get(question.group) ?? []),
      question,
    ]);
    return groups;
  }, new Map());
  const latestApprovals = workspace.briefing?.approvals ?? [];
  const contentApproved = Boolean(
    workspace.revision &&
    latestApprovals.some(
      (approval) =>
        approval.approvalType === "CONTENT" &&
        approval.decision === "APPROVED" &&
        approval.revisionVersion === workspace.revision!.version &&
        approval.revisionHash === workspace.revision!.contentHash,
    ),
  );

  return (
    <section
      className="border-border grid gap-6 rounded-md border p-5"
      aria-labelledby="briefing-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            Project workspace
          </p>
          <h2 id="briefing-title" className="mt-1 text-xl font-semibold">
            Briefing e âmbito
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Perguntas comuns, da indústria e apenas dos campos suportados pela
            versão fixada.
          </p>
        </div>
        <div className="min-w-40">
          <p className="text-sm font-medium">Progresso</p>
          <progress
            className="accent-primary mt-2 h-2 w-full"
            value={completion.completed}
            max={completion.total}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {completion.completed} de {completion.total} respostas ·{" "}
            {completion.percent}%
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-muted/40 rounded-md p-3">
          <p className="text-muted-foreground text-xs">Estado</p>
          <p className="mt-1 text-sm font-medium">
            {statusLabels[workspace.briefing?.status ?? "DRAFT"] ?? "Rascunho"}
          </p>
        </div>
        <div className="bg-muted/40 rounded-md p-3">
          <p className="text-muted-foreground text-xs">Revisão atual</p>
          <p className="mt-1 text-sm font-medium">
            {workspace.revision
              ? `v${workspace.revision.version}`
              : "Ainda não guardada"}
          </p>
        </div>
        <div className="bg-muted/40 rounded-md p-3">
          <p className="text-muted-foreground text-xs">Origem fixada</p>
          <p
            className="mt-1 truncate text-sm font-medium"
            title={workspace.templateVersion ?? undefined}
          >
            {workspace.templateVersion ?? "Sem snapshot provisionado"}
          </p>
        </div>
      </div>
      <ProjectChecklist
        projectId={projectId}
        items={records.checklist}
        canWrite={canWrite}
      />
      <ProjectReadiness scores={readiness} />
      {workspace.briefing?.revisions.length ? (
        <details className="border-border rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Histórico de revisões ({workspace.briefing.revisions.length})
          </summary>
          <ol className="mt-3 grid gap-2">
            {workspace.briefing.revisions.map((revision) => (
              <li
                key={revision.id}
                className="border-border flex flex-wrap justify-between gap-2 border-t py-2 text-sm"
              >
                <span>
                  Revisão v{revision.version}
                  {revision.version === workspace.briefing?.currentVersion
                    ? " · atual"
                    : ""}
                </span>
                <span className="text-muted-foreground">
                  {revision.submittedByName
                    ? `Enviada por ${revision.submittedByName} · `
                    : ""}
                  {new Date(revision.createdAt).toLocaleString("pt-PT")} ·{" "}
                  {revision.sourceTemplateVersion ?? "sem versão de template"}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {canWrite ? (
        <BriefingEditorForm
          projectId={projectId}
          initialVersion={workspace.briefing?.currentVersion ?? 0}
          questions={workspace.questions}
          answers={workspace.answers}
        />
      ) : (
        <div className="grid gap-4">
          {[...grouped.entries()].map(([group, questions]) => (
            <section key={group}>
              <h3 className="font-medium">{group}</h3>
              <dl className="mt-2 grid gap-3">
                {questions.map((question) => (
                  <div key={question.key}>
                    <dt className="text-muted-foreground text-xs">
                      {question.label}
                    </dt>
                    <dd className="text-sm">
                      {workspace.answers[question.key] || "Por preencher"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      {canWrite ? (
        <div className="border-border flex flex-wrap gap-3 border-t pt-4">
          <ActionFeedbackForm
            action={requestBriefingReviewAction}
            loadingMessage="A pedir revisão..."
            successMessage="Revisão do briefing pedida."
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="hidden"
              name="expectedVersion"
              value={workspace.revision?.version ?? 0}
            />
            <Button
              variant="outline"
              type="submit"
              disabled={!workspace.revision}
            >
              <MessagesSquare aria-hidden="true" /> Pedir revisão
            </Button>
          </ActionFeedbackForm>
        </div>
      ) : null}

      <div className="border-border grid gap-3 border-t pt-5">
        <div>
          <h3 className="font-semibold">Partilha e decisão do cliente</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            O cliente pode rever a revisão atual e confirmar o âmbito ou pedir
            alterações. A decisão fica ligada ao hash e à versão.
          </p>
        </div>
        {canWrite ? (
          <>
            <BriefingShareControl
              projectId={projectId}
              exports={workspace.approvableExports}
            />
            {workspace.briefing?.shares.some(
              (share) => !share.revokedAt && share.expiresAt > new Date(),
            ) ? (
              <ActionFeedbackForm
                action={revokeBriefingSharesAction}
                loadingMessage="A revogar..."
                successMessage="Ligações revogadas."
              >
                <input type="hidden" name="projectId" value={projectId} />
                <Button type="submit" variant="outline">
                  Revogar ligações ativas
                </Button>
              </ActionFeedbackForm>
            ) : null}
            <section className="border-border grid gap-3 rounded-md border p-4">
              <h4 className="font-medium">Aprovação interna da revisão</h4>
              <ActionFeedbackForm
                action={recordBriefingApprovalAction}
                loadingMessage="A registar decisão..."
                successMessage="Decisão registada."
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <Field>
                  <Label htmlFor={`approval-type-${projectId}`}>
                    Âmbito da decisão
                  </Label>
                  <Select
                    id={`approval-type-${projectId}`}
                    name="type"
                    defaultValue="SCOPE"
                  >
                    <option value="SCOPE">Âmbito</option>
                    <option value="CONTENT">Conteúdo</option>
                  </Select>
                </Field>
                <p className="text-muted-foreground text-sm sm:col-span-2">
                  Esta decisão fica associada à revisão do briefing. Não
                  representa aprovação do design, preview ou publicação.
                </p>
                <Field>
                  <Label htmlFor={`approval-decision-${projectId}`}>
                    Decisão
                  </Label>
                  <Select
                    id={`approval-decision-${projectId}`}
                    name="decision"
                    defaultValue="APPROVED"
                  >
                    <option value="APPROVED">Aprovado</option>
                    <option value="REVISION_REQUESTED">Pedir alterações</option>
                    <option value="REJECTED">Rejeitado</option>
                  </Select>
                </Field>
                <Field className="sm:col-span-2">
                  <Label htmlFor={`approval-comment-${projectId}`}>
                    Comentário (opcional)
                  </Label>
                  <Textarea
                    id={`approval-comment-${projectId}`}
                    name="comment"
                    maxLength={1500}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={!workspace.revision}>
                    Registar decisão interna
                  </Button>
                </div>
              </ActionFeedbackForm>
            </section>
          </>
        ) : null}
        {latestApprovals.length ? (
          <ul className="grid gap-2 text-sm">
            {latestApprovals.map((approval) => (
              <li
                key={approval.id}
                className="border-border rounded-md border p-3"
              >
                {approval.approvalType}:{" "}
                {approval.decision === "APPROVED"
                  ? "Aprovado"
                  : approval.decision === "REJECTED"
                    ? "Rejeitado"
                    : "Alterações pedidas"}{" "}
                · v{approval.revisionVersion} ·{" "}
                {approval.decidedByName ?? "equipa interna"}
                {approval.comment ? ` · ${approval.comment}` : ""}
                {approval.approvalType === "DESIGN" &&
                approval.artifactChecksum ? (
                  <span className="text-muted-foreground mt-2 block text-xs">
                    Preview SHA-256: {approval.artifactChecksum}
                    {workspace.currentPreviewChecksum
                      ? approval.artifactChecksum ===
                        workspace.currentPreviewChecksum
                        ? " · corresponde ao preview atual"
                        : " · decisão histórica; o preview atual é diferente"
                      : " · preview atual indisponível para comparação"}
                  </span>
                ) : null}
                {approval.approvalType === "RELEASE" &&
                approval.artifactChecksum ? (
                  <span className="text-muted-foreground mt-2 block text-xs">
                    Pacote SHA-256: {approval.artifactChecksum}
                    {workspace.approvableExports.some(
                      (item) =>
                        item.artifactChecksum === approval.artifactChecksum,
                    )
                      ? " · exportação ainda válida para o preview atual"
                      : " · exportação histórica, expirada ou substituída"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {canWrite ? (
        <div className="border-border grid gap-4 border-t pt-5">
          <div>
            <h3 className="font-semibold">Conteúdo mapeado para a cópia</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              As respostas de campos suportados são propostas; nenhuma é
              aplicada automaticamente. A aprovação interna de conteúdo é
              necessária.
            </p>
          </div>
          {workspace.mappedContent.length ? (
            <ul className="grid gap-2">
              {workspace.mappedContent.map((item) => (
                <li
                  key={`${item.sectionKey}.${item.field}`}
                  className="bg-muted/30 rounded-md p-3 text-sm"
                >
                  <span className="font-medium">
                    {item.sectionKey} · {item.field}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{item.value}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ainda não existem respostas ligadas a campos de secções.
            </p>
          )}
          {workspace.provisionedPageId ? (
            <ActionFeedbackForm
              action={async (data) => {
                await applyBriefingMappedContentAction(data);
              }}
              loadingMessage="A aplicar campos aprovados..."
              successMessage="Conteúdos aplicados à cópia do projeto."
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input
                type="hidden"
                name="expectedVersion"
                value={workspace.revision?.version ?? 0}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!contentApproved || !workspace.mappedContent.length}
              >
                <ClipboardList aria-hidden="true" /> Aplicar à cópia
                provisionada
              </Button>
            </ActionFeedbackForm>
          ) : (
            <p className="text-muted-foreground text-sm">
              Provisiona primeiro a cópia privada para poderes aplicar campos
              mapeados.
            </p>
          )}
        </div>
      ) : null}

      {canWrite ? (
        <section className="border-border grid gap-4 border-t pt-5">
          <div>
            <h3 className="font-semibold">Contexto para ferramentas de IA</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Opt-in por geração, seleção explícita e revisão antes de copiar.
            </p>
          </div>
          <BriefingAiContextForm
            projectId={projectId}
            questions={workspace.questions}
            answers={workspace.answers}
          />
        </section>
      ) : null}

      {canWrite ? (
        <section className="border-border grid gap-4 border-t pt-5">
          <div>
            <h3 className="font-semibold">Especificação do projeto</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Gera uma versão interna ou uma cópia para rever e partilhar,
              sempre a partir da revisão atual.
            </p>
          </div>
          <ProjectSpecificationControl projectId={projectId} />
        </section>
      ) : null}

      {canWrite ? (
        <div className="border-border grid gap-6 border-t pt-5 lg:grid-cols-2">
          <section className="grid content-start gap-4">
            <div>
              <h3 className="font-semibold">Reuniões e decisões</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Registo interno de reuniões, decisões e ações acordadas.
              </p>
            </div>
            <ActionFeedbackForm
              action={createProjectMeetingAction}
              loadingMessage="A guardar reunião..."
              successMessage="Reunião registada."
              className="grid gap-3"
            >
              <input type="hidden" name="projectId" value={projectId} />
              <Field>
                <Label htmlFor={`meeting-title-${projectId}`}>Título</Label>
                <Input
                  id={`meeting-title-${projectId}`}
                  name="title"
                  required
                  maxLength={160}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <Label htmlFor={`meeting-type-${projectId}`}>Tipo</Label>
                  <Select
                    id={`meeting-type-${projectId}`}
                    name="type"
                    defaultValue="CALL"
                  >
                    {["CALL", "VIDEO_CALL", "IN_PERSON", "EMAIL", "OTHER"].map(
                      (value) => (
                        <option key={value} value={value}>
                          {
                            (
                              {
                                CALL: "Chamada",
                                VIDEO_CALL: "Videochamada",
                                IN_PERSON: "Presencial",
                                EMAIL: "Email",
                                OTHER: "Outro",
                              } as Record<string, string>
                            )[value]
                          }
                        </option>
                      ),
                    )}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor={`meeting-date-${projectId}`}>Data</Label>
                  <Input
                    id={`meeting-date-${projectId}`}
                    name="happenedAt"
                    type="date"
                    required
                  />
                </Field>
              </div>
              <Field>
                <Label htmlFor={`meeting-summary-${projectId}`}>Resumo</Label>
                <Textarea
                  id={`meeting-summary-${projectId}`}
                  name="summary"
                  required
                  maxLength={5000}
                />
              </Field>
              <Field>
                <Label htmlFor={`meeting-decisions-${projectId}`}>
                  Decisões (uma por linha)
                </Label>
                <Textarea
                  id={`meeting-decisions-${projectId}`}
                  name="decisions"
                />
              </Field>
              <Field>
                <Label htmlFor={`meeting-actions-${projectId}`}>
                  Ações a acompanhar (uma por linha)
                </Label>
                <Textarea
                  id={`meeting-actions-${projectId}`}
                  name="actionItems"
                />
              </Field>
              <Button type="submit">Registar reunião</Button>
            </ActionFeedbackForm>
            {records.meetings.map((meeting) => (
              <article
                key={meeting.id}
                className="border-border rounded-md border p-3"
              >
                <p className="font-medium">{meeting.title}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(meeting.happenedAt).toLocaleString("pt-PT")} ·{" "}
                  {meeting.meetingType}
                </p>
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {meeting.summary}
                </p>
              </article>
            ))}
          </section>
          <section className="grid content-start gap-4">
            <div>
              <h3 className="font-semibold">Propostas</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Versões comerciais internas; não enviam email nem constituem
                contrato.
              </p>
            </div>
            <ActionFeedbackForm
              action={createProjectProposalAction}
              loadingMessage="A criar proposta..."
              successMessage="Nova versão de proposta criada."
              className="grid gap-3"
            >
              <input type="hidden" name="projectId" value={projectId} />
              <Field>
                <Label htmlFor={`proposal-package-${projectId}`}>Pacote</Label>
                <Input
                  id={`proposal-package-${projectId}`}
                  name="packageName"
                  required
                  maxLength={160}
                />
              </Field>
              <Field>
                <Label htmlFor={`proposal-scope-${projectId}`}>
                  Âmbito e exclusões
                </Label>
                <Textarea
                  id={`proposal-scope-${projectId}`}
                  name="scope"
                  required
                  maxLength={8000}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <Label htmlFor={`proposal-amount-${projectId}`}>
                    Valor (opcional)
                  </Label>
                  <Input
                    id={`proposal-amount-${projectId}`}
                    name="amount"
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`proposal-valid-${projectId}`}>
                    Válida até
                  </Label>
                  <Input
                    id={`proposal-valid-${projectId}`}
                    name="validUntil"
                    type="date"
                  />
                </Field>
              </div>
              <Field>
                <Label htmlFor={`proposal-support-${projectId}`}>Suporte</Label>
                <Textarea
                  id={`proposal-support-${projectId}`}
                  name="supportTerms"
                  maxLength={3000}
                />
              </Field>
              <Field>
                <Label htmlFor={`proposal-maintenance-${projectId}`}>
                  Manutenção
                </Label>
                <Textarea
                  id={`proposal-maintenance-${projectId}`}
                  name="maintenanceTerms"
                  maxLength={3000}
                />
              </Field>
              <Button type="submit">Criar versão da proposta</Button>
            </ActionFeedbackForm>
            {records.proposals.map((proposal) => (
              <article
                key={proposal.id}
                className="border-border grid gap-2 rounded-md border p-3"
              >
                <p className="font-medium">
                  v{proposal.version} · {proposal.packageName} ·{" "}
                  {proposalStatusLabels[proposal.status]}
                </p>
                <p className="text-sm">{proposal.scope}</p>
                <p className="text-muted-foreground text-xs">
                  {proposal.amount
                    ? `${proposal.amount.toString()} ${proposal.currency}`
                    : "Sem valor definido"}
                  {proposal.validUntil
                    ? ` · válida até ${new Date(proposal.validUntil).toLocaleDateString("pt-PT")}`
                    : ""}
                </p>
                <ActionFeedbackForm
                  action={updateProjectProposalStatusAction}
                  loadingMessage="A atualizar estado..."
                  successMessage="Estado atualizado."
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <Select
                    aria-label={`Estado da proposta v${proposal.version}`}
                    name="status"
                    defaultValue={proposal.status}
                  >
                    {["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {proposalStatusLabels[status]}
                        </option>
                      ),
                    )}
                  </Select>
                  <Button className="mt-2" type="submit" variant="outline">
                    Atualizar estado
                  </Button>
                </ActionFeedbackForm>
              </article>
            ))}
          </section>
        </div>
      ) : null}

      {canWrite ? (
        <section className="border-border grid gap-4 border-t pt-5">
          <div>
            <h3 className="font-semibold">Materiais e direitos</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Regista texto, links e materiais recebidos. Confirma direitos
              antes de aprovar imagens, logótipos, testemunhos ou documentos.
            </p>
          </div>
          <ActionFeedbackForm
            action={createProjectAssetAction}
            loadingMessage="A registar material..."
            successMessage="Material registado."
            className="grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <Field>
              <Label htmlFor={`asset-title-${projectId}`}>Nome</Label>
              <Input
                id={`asset-title-${projectId}`}
                name="title"
                required
                maxLength={160}
              />
            </Field>
            <Field>
              <Label htmlFor={`asset-kind-${projectId}`}>Tipo</Label>
              <Select
                id={`asset-kind-${projectId}`}
                name="kind"
                defaultValue="TEXT"
              >
                {[
                  "TEXT",
                  "IMAGE",
                  "VIDEO",
                  "DOCUMENT",
                  "LOGO",
                  "BRAND_ASSET",
                  "TESTIMONIAL",
                  "OTHER",
                ].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </Field>
            {mediaOptions.length ? (
              <Field>
                <Label htmlFor={`asset-media-${projectId}`}>
                  Ficheiro da biblioteca (opcional)
                </Label>
                <Select
                  id={`asset-media-${projectId}`}
                  name="mediaAssetId"
                  defaultValue=""
                >
                  <option value="">Sem ficheiro associado</option>
                  {mediaOptions.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.originalFilename} · {asset.mimeType}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field>
                <Label htmlFor={`asset-section-${projectId}`}>
                  Secção relacionada (opcional)
                </Label>
                <Input
                  id={`asset-section-${projectId}`}
                  name="sectionKey"
                  maxLength={120}
                />
              </Field>
            )}
            {mediaOptions.length ? (
              <Field>
                <Label htmlFor={`asset-section-${projectId}`}>
                  Secção relacionada (opcional)
                </Label>
                <Input
                  id={`asset-section-${projectId}`}
                  name="sectionKey"
                  maxLength={120}
                />
              </Field>
            ) : null}
            <Field>
              <Label htmlFor={`asset-url-${projectId}`}>
                Ligação de origem (opcional)
              </Label>
              <Input
                id={`asset-url-${projectId}`}
                name="sourceUrl"
                type="url"
                maxLength={2048}
              />
            </Field>
            <Field className="sm:col-span-2">
              <Label htmlFor={`asset-content-${projectId}`}>
                Conteúdo ou notas (opcional)
              </Label>
              <Textarea
                id={`asset-content-${projectId}`}
                name="content"
                maxLength={8000}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Registar material recebido</Button>
            </div>
          </ActionFeedbackForm>
          {records.assets.map((asset) => (
            <article
              key={asset.id}
              className="border-border grid gap-2 rounded-md border p-3"
            >
              <p className="font-medium">
                {asset.title} · {assetStatusLabels[asset.status]}
              </p>
              <p className="text-muted-foreground text-xs">
                {asset.kind}
                {asset.sectionKey ? ` · ${asset.sectionKey}` : ""}
                {asset.mediaAsset
                  ? ` · ${asset.mediaAsset.originalFilename}`
                  : ""}
              </p>
              {asset.content ? (
                <p className="text-sm whitespace-pre-wrap">{asset.content}</p>
              ) : null}
              {asset.mediaAsset?.publicUrl ? (
                <a
                  className="text-primary text-sm break-all underline"
                  href={asset.mediaAsset.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir ficheiro associado
                </a>
              ) : null}
              {asset.sourceUrl ? (
                <a
                  className="text-primary text-sm break-all underline"
                  href={asset.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir origem
                </a>
              ) : null}
              <ActionFeedbackForm
                action={reviewProjectAssetAction}
                loadingMessage="A guardar revisão..."
                successMessage="Estado do material atualizado."
                className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="assetId" value={asset.id} />
                <Select
                  aria-label={`Estado do material ${asset.title}`}
                  name="status"
                  defaultValue={asset.status}
                >
                  {["RECEIVED", "IN_REVIEW", "APPROVED", "REJECTED"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {assetStatusLabels[status]}
                      </option>
                    ),
                  )}
                </Select>
                <Input
                  name="reviewNote"
                  aria-label={`Nota de revisão de ${asset.title}`}
                  defaultValue={asset.reviewNote ?? ""}
                  placeholder="Nota de revisão"
                  maxLength={1000}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="rightsConfirmed"
                    defaultChecked={Boolean(asset.rightsConfirmedAt)}
                  />{" "}
                  Direitos confirmados
                </label>
                <div className="sm:col-span-3">
                  <Button type="submit" variant="outline">
                    Atualizar revisão
                  </Button>
                </div>
              </ActionFeedbackForm>
            </article>
          ))}
        </section>
      ) : null}

      {records.exports.length ? (
        <section className="border-border border-t pt-5">
          <h3 className="font-semibold">Histórico de contextos para IA</h3>
          <ul className="mt-3 grid gap-2 text-sm">
            {records.exports.map((item) => (
              <li key={item.id} className="border-border rounded-md border p-3">
                {item.format.toUpperCase()} · revisão v{item.briefingVersion} ·{" "}
                {item.purpose} ·{" "}
                {new Date(item.createdAt).toLocaleString("pt-PT")} · hash{" "}
                {item.contentHash.slice(0, 12)}…
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {records.timeline.length ? (
        <section className="border-border border-t pt-5">
          <h3 className="font-semibold">Linha temporal do projeto</h3>
          <ol className="mt-3 grid gap-2">
            {records.timeline.map((event) => (
              <li
                key={event.id}
                className="border-border flex flex-wrap justify-between gap-2 border-l-2 pl-3 text-sm"
              >
                <span>
                  {event.label}
                  {event.status
                    ? ` · ${projectStatusLabels[event.status] ?? event.status}`
                    : event.previousStatus
                      ? ` · ${projectStatusLabels[event.previousStatus] ?? event.previousStatus}`
                      : ""}
                </span>
                <time
                  className="text-muted-foreground"
                  dateTime={event.createdAt.toISOString()}
                >
                  {new Date(event.createdAt).toLocaleString("pt-PT")}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <p className="text-muted-foreground text-xs">
        As revisões são imutáveis. Alterar o template oficial não altera as
        perguntas deste projeto; o contexto de IA não é persistido, apenas a
        finalidade, os campos escolhidos e o hash de auditoria.
      </p>
    </section>
  );
}
