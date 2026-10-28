import Link from "next/link";

import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Alert, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";
import { ProjectMaintenanceDestination } from "@/generated/prisma/client";
import {
  createMaintenanceReleaseAction,
  createTemplateRebaseCandidateAction,
  recordMaintenanceApprovalAction,
  recordMaintenancePublicationAction,
  resolveTemplateRebaseConflictAction,
  validateMaintenanceReleaseAction,
} from "@/features/projects/actions/project-maintenance.actions";
import type { listProjectMaintenanceReleases, listProjectTemplateRebaseSources } from "@/features/projects/services/project-maintenance.service";
import { parseFormConflict, parseFormFieldConflict } from "@/features/projects/services/template-rebase";

type Release = Awaited<ReturnType<typeof listProjectMaintenanceReleases>>[number];
type RebaseSource = Awaited<ReturnType<typeof listProjectTemplateRebaseSources>>[number];

const statusLabel: Record<Release["status"], string> = {
  DRAFT: "Rascunho",
  VALIDATED: "Validada",
  PUBLISHED: "Publicada",
  FAILED: "Falhou na validação",
};

export function ProjectMaintenancePanel({
  projectId,
  maintenancePlan,
  maintenanceScope,
  releases,
  rebaseSources,
}: {
  projectId: string;
  maintenancePlan: string;
  maintenanceScope: string | null;
  releases: Release[];
  rebaseSources: RebaseSource[];
}) {
  return (
    <section aria-labelledby="project-maintenance-heading" className="grid gap-4">
      <div>
        <h2 id="project-maintenance-heading" className="text-lg font-semibold">Manutenção da landing</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {maintenancePlan === "CONTRACTED" ? "Plano contratado" : "Manutenção sob pedido"}
          {maintenanceScope ? ` · Âmbito: ${maintenanceScope}` : " · Confirma o âmbito acordado antes de cada alteração."}
        </p>
      </div>
      <Alert tone="info" title="Landing Only · fonte interna">
        Cada alteração é preparada numa cópia privada. O cliente não recebe acesso ao CMS. A publicação não é automática: o pacote validado é descarregado, aplicado no destino contratado e confirmado por um operador. Não guardamos credenciais de alojamento.
      </Alert>
      <Card>
        <ActionFeedbackForm
          action={createMaintenanceReleaseAction}
          className="grid gap-4"
          loadingMessage="A criar versão isolada…"
          successMessage="Versão candidata criada. Edita o conteúdo antes da validação."
          errorMessage="Não foi possível criar a versão candidata. Confirma o plano de manutenção e a atribuição ao projeto."
        >
          <input name="projectId" type="hidden" value={projectId} />
          <Field>
            <Label htmlFor={`maintenance-summary-${projectId}`}>Alteração contratada</Label>
            <Textarea id={`maintenance-summary-${projectId}`} name="changeSummary" maxLength={2000} required rows={3} placeholder="Descreve o pedido aprovado e o resultado esperado." />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox name="approvalRequired" className="mt-0.5" />
            <span>Exigir aprovação explícita do cliente antes da publicação.</span>
          </label>
          <div><Button type="submit">Criar versão candidata</Button></div>
        </ActionFeedbackForm>
      </Card>
      {rebaseSources.length ? (
        <Card>
          <h3 className="font-semibold">Atualizar a base do template</h3>
          <p className="text-muted-foreground mt-1 text-sm">Compara a demo oficial selecionada com a baseline aceite e a versão publicada do projeto. As alterações do cliente são preservadas; conflitos exigem revisão antes da publicação.</p>
          <ActionFeedbackForm
            action={createTemplateRebaseCandidateAction}
            className="mt-4 grid gap-4"
            loadingMessage="A comparar versões e a preparar uma candidata…"
            successMessage="Candidata de rebase criada. Revê o relatório e resolve os conflitos antes de validar."
            errorMessage="Não foi possível preparar o rebase. Confirma a variante, a baseline e a atribuição ao projeto."
          >
            <input name="projectId" type="hidden" value={projectId} />
            <Field>
              <Label htmlFor={`rebase-source-${projectId}`}>Nova demo oficial</Label>
              <Select id={`rebase-source-${projectId}`} name="sourcePageId" required defaultValue="">
                <option value="" disabled>Seleciona uma demo publicada da mesma variante</option>
                {rebaseSources.map((source) => <option key={source.id} value={source.id}>{source.title} · atualizada em {source.updatedAt.toLocaleDateString("pt-PT")}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor={`rebase-summary-${projectId}`}>Motivo/âmbito aprovado</Label>
              <Textarea id={`rebase-summary-${projectId}`} name="changeSummary" maxLength={2000} required rows={2} placeholder="Ex.: atualizar a base para a versão oficial revista em outubro." />
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox name="approvalRequired" className="mt-0.5" />
              <span>Exigir aprovação explícita do cliente antes da publicação.</span>
            </label>
            <div><Button type="submit" variant="outline">Comparar e criar candidata</Button></div>
          </ActionFeedbackForm>
        </Card>
      ) : null}
      {releases.length ? (
        <Stack>
          {releases.map((release) => (
            <MaintenanceReleaseRow key={release.id} projectId={projectId} release={release} />
          ))}
        </Stack>
      ) : (
        <Card><p className="text-sm">Ainda não existem versões de manutenção. A primeira parte da release da cópia privada do projeto.</p></Card>
      )}
    </section>
  );
}

function MaintenanceReleaseRow({ projectId, release }: { projectId: string; release: Release }) {
  const report = release.validationReport && typeof release.validationReport === "object" && !Array.isArray(release.validationReport)
    ? release.validationReport as Record<string, unknown>
    : null;
  const findings = Array.isArray(report?.findings) ? report.findings as Array<{ code?: string; message?: string }> : [];
  const downloadUrl = `/api/projects/${projectId}/maintenance/${release.id}/artifact`;
  const rebaseReport = release.rebaseReport && typeof release.rebaseReport === "object" && !Array.isArray(release.rebaseReport)
    ? release.rebaseReport as Record<string, unknown>
    : null;
  const conflicts = Array.isArray(rebaseReport?.conflicts) ? rebaseReport.conflicts.filter((item): item is string => typeof item === "string") : [];
  const resolvedConflicts = Array.isArray(rebaseReport?.conflictResolutions)
    ? rebaseReport.conflictResolutions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
        .map((item) => item.path)
        .filter((path): path is string => typeof path === "string")
    : [];
  const unresolvedConflicts = conflicts.filter((path) => !resolvedConflicts.includes(path));

  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Release v{release.version} · {release.candidatePage.title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{release.changeSummary}</p>
          <p className="text-muted-foreground mt-1 text-xs">Criada por {release.createdBy.name ?? release.createdBy.email} em {release.createdAt.toLocaleString("pt-PT")}</p>
        </div>
        <Badge tone={release.status === "PUBLISHED" ? "success" : release.status === "FAILED" ? "error" : release.status === "VALIDATED" ? "info" : "warning"}>
          {statusLabel[release.status]}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/projects/${projectId}/maintenance/${release.id}`}><Button variant="outline">Editar e rever</Button></Link>
        {release.status !== "PUBLISHED" ? (
          <ActionFeedbackForm action={validateMaintenanceReleaseAction} loadingMessage="A executar build e auditoria isolados…" successMessage="Build e auditoria concluídos." errorMessage="A validação bloqueou esta versão; consulta o estado e corrige a cópia.">
            <input name="projectId" type="hidden" value={projectId} />
            <input name="releaseId" type="hidden" value={release.id} />
            <Button type="submit" variant="outline" disabled={unresolvedConflicts.length > 0}>Validar build e pacote</Button>
          </ActionFeedbackForm>
        ) : null}
        {release.status !== "PUBLISHED" && unresolvedConflicts.length > 0 ? (
          <p className="text-warning text-sm" role="status">Resolve os {unresolvedConflicts.length} conflitos pendentes antes da validação.</p>
        ) : null}
        {release.status === "VALIDATED" && unresolvedConflicts.length === 0 ? (
          <a href={downloadUrl}><Button variant="outline">Descarregar pacote validado</Button></a>
        ) : null}
      </div>
      {report ? (
        <div className="text-muted-foreground grid gap-1 text-xs">
          <p>Build: {report.buildPassed ? "passou" : "não passou"} · Auditoria: {report.auditPassed ? "passou" : "bloqueada"}</p>
          <p>Ficheiros: {String(report.fileCount ?? "—")} · Tamanho: {String(report.totalBytes ?? "—")} bytes</p>
          {findings.map((finding, index) => <p key={`${finding.code ?? "finding"}-${index}`}>{finding.code}: {finding.message}</p>)}
        </div>
      ) : release.failureCode ? <Alert tone="error" title="Validação não concluída">Código: {release.failureCode}. Corrige a versão candidata e valida novamente.</Alert> : null}
      {release.rebaseReport && typeof release.rebaseReport === "object" && !Array.isArray(release.rebaseReport) ? (
        <RebaseSummary projectId={projectId} releaseId={release.id} report={release.rebaseReport as Record<string, unknown>} />
      ) : null}
      {release.status === "VALIDATED" && release.approvalRequired && !release.approvedAt ? (
        <ActionFeedbackForm action={recordMaintenanceApprovalAction} className="grid gap-3 sm:grid-cols-[1fr_auto]" loadingMessage="A registar aprovação…" successMessage="Aprovação registada." errorMessage="Não foi possível registar a aprovação.">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="releaseId" type="hidden" value={release.id} />
          <Field><Label htmlFor={`approval-${release.id}`}>Referência interna da aprovação</Label><Input id={`approval-${release.id}`} name="approvalReference" maxLength={300} required placeholder="Ex.: email confirmado em 24/10/2026" /></Field>
          <div className="flex items-end"><Button type="submit" variant="outline">Registar aprovação</Button></div>
        </ActionFeedbackForm>
      ) : null}
      {release.status === "VALIDATED" && release.packageDownloadedAt ? (
        <ActionFeedbackForm action={recordMaintenancePublicationAction} className="grid gap-3 sm:grid-cols-2" loadingMessage="A registar publicação verificada…" successMessage="Publicação e verificação registadas." errorMessage="A publicação não foi registada. Confirma aprovação, pacote e dados do destino.">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="releaseId" type="hidden" value={release.id} />
          <Field><Label htmlFor={`destination-${release.id}`}>Destino</Label><Select id={`destination-${release.id}`} name="destination" defaultValue={ProjectMaintenanceDestination.CLIENT_HOSTED}><option value={ProjectMaintenanceDestination.CLIENT_HOSTED}>Alojamento do cliente</option><option value={ProjectMaintenanceDestination.LANDINGFORGE_HOSTED}>Alojamento gerido pela LandingForge</option></Select></Field>
          <Field><Label htmlFor={`destination-label-${release.id}`}>Identificação do destino</Label><Input id={`destination-label-${release.id}`} name="destinationLabel" maxLength={300} required placeholder="Domínio ou nome do ambiente (sem credenciais)" /></Field>
          <Field className="sm:col-span-2"><Label htmlFor={`verification-${release.id}`}>Verificação pós-publicação</Label><Textarea id={`verification-${release.id}`} name="verification" maxLength={1000} required rows={2} placeholder="Regista o URL verificado, data e resultado do health check manual." /></Field>
          <div className="sm:col-span-2"><Button type="submit">Confirmar publicação verificada</Button></div>
        </ActionFeedbackForm>
      ) : null}
      {release.status === "PUBLISHED" ? (
        <div className="text-muted-foreground grid gap-1 text-xs">
          <p>Destino: {release.destinationLabel ?? release.destination} · Publicado por {release.publishedBy?.name ?? release.publishedBy?.email ?? "utilizador removido"} em {release.publishedAt?.toLocaleString("pt-PT") ?? "—"}</p>
          <p>Verificação: {release.deploymentVerification}</p>
          <p className="break-all font-mono">SHA-256 do pacote: {release.packageChecksum}</p>
        </div>
      ) : null}
      {release.status === "PUBLISHED" ? (
        <ActionFeedbackForm action={createMaintenanceReleaseAction} className="flex flex-wrap items-center gap-3" loadingMessage="A preparar pacote de rollback…" successMessage="Cópia de recuperação criada como nova candidata; valida-a antes de publicar." errorMessage="Não foi possível preparar o rollback.">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="rollbackToReleaseId" type="hidden" value={release.id} />
          <input name="changeSummary" type="hidden" value={`Recuperação baseada na versão publicada v${release.version}. Rever e validar antes de republicar.`} />
          <Button type="submit" variant="outline">Preparar recuperação desta versão</Button>
          <span className="text-muted-foreground text-xs">Cria uma nova versão candidata; não altera nem apaga releases publicadas.</span>
        </ActionFeedbackForm>
      ) : null}
    </Card>
  );
}

function RebaseSummary({ projectId, releaseId, report }: { projectId: string; releaseId: string; report: Record<string, unknown> }) {
  const conflicts = Array.isArray(report.conflicts) ? report.conflicts.filter((item): item is string => typeof item === "string") : [];
  const resolvedConflicts = Array.isArray(report.conflictResolutions)
    ? report.conflictResolutions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
        .map((item) => item.path)
        .filter((path): path is string => typeof path === "string")
    : [];
  const unresolved = conflicts.filter((path) => !resolvedConflicts.includes(path));
  const count = (key: string) => Array.isArray(report[key]) ? (report[key] as unknown[]).length : 0;
  return (
    <Alert tone={conflicts.length ? "warning" : "info"} title={`Rebase ${String(report.sourceTemplateVersion ?? "")} → ${String(report.targetTemplateVersion ?? "")}`}>
      <p>Adicionadas: {count("addedSections")} secções, {count("addedForms")} formulários, {count("addedFields")} campos e {count("addedAssets")} assets. Alteradas na origem: {count("changedSections")} secções, {count("changedForms")} formulários, {count("changedFields")} campos e {count("changedAssets")} assets. Removidas na origem, mas preservadas: {count("removedSectionsPreserved")} secções, {count("removedFormsPreserved")} formulários, {count("removedFieldsPreserved")} campos e {count("removedAssetsPreserved")} assets.</p>
      {conflicts.length ? (
        <div className="mt-2">
          <p className="font-medium">Decisões de conflito: {conflicts.length - unresolved.length}/{conflicts.length}</p>
          <div className="mt-3 grid gap-3">
            {conflicts.map((conflict, index) => {
              const isResolved = resolvedConflicts.includes(conflict);
              const fieldConflict = parseFormFieldConflict(conflict);
              const formConflict = fieldConflict ? null : parseFormConflict(conflict);
              const canUseTemplate = Boolean(fieldConflict || (formConflict && (formConflict.property || formConflict.replacesWholeForm)));
              return (
                <div key={conflict} className="border-border grid gap-2 rounded-md border p-3">
                  <p className="break-all text-xs">{conflict}</p>
                  {isResolved ? (
                    <p className="text-success text-sm">Decisão registada.</p>
                  ) : (
                    <ActionFeedbackForm
                      action={resolveTemplateRebaseConflictAction}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                      loadingMessage="A registar decisão…"
                      successMessage="Decisão registada; será necessário validar novamente."
                      errorMessage="Não foi possível registar esta decisão."
                    >
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="releaseId" type="hidden" value={releaseId} />
                      <input name="conflictPath" type="hidden" value={conflict} />
                      {canUseTemplate ? (
                        <Field>
                          <Label htmlFor={`rebase-conflict-${releaseId}-${index}`}>Decisão para o conflito</Label>
                          <Select id={`rebase-conflict-${releaseId}-${index}`} name="decision" defaultValue="CURRENT">
                            <option value="CURRENT">Manter o valor atual do cliente</option>
                            <option value="TEMPLATE">{formConflict?.replacesWholeForm ? "Aplicar o formulário oficial completo" : formConflict ? "Aplicar o valor oficial" : "Aplicar o valor da demo oficial"}</option>
                          </Select>
                        </Field>
                      ) : (
                        <>
                          <input name="decision" type="hidden" value="CURRENT" />
                          <p className="text-muted-foreground text-sm">
                            {conflict.startsWith("secção.")
                              ? "Revê ou edita esta secção na candidata antes de confirmares a decisão."
                              : "Revê o conflito. A confirmação preserva o formulário atual do cliente neste ponto."}
                          </p>
                        </>
                      )}
                      <div><Button type="submit" variant="outline">{canUseTemplate ? "Registar decisão" : "Confirmar revisão"}</Button></div>
                    </ActionFeedbackForm>
                  )}
                </div>
              );
            })}
          </div>
          {unresolved.length ? <p className="mt-3">A validação do pacote fica bloqueada até cada conflito ser revisto e registado.</p> : <p className="mt-3">Todos os conflitos têm uma decisão. Revê a pré-visualização e volta a validar o build/auditoria antes de publicar.</p>}
        </div>
      ) : <p className="mt-2">Não foram detetados conflitos de conteúdo. Revê a pré-visualização antes de validar.</p>}
    </Alert>
  );
}
