import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ContentPreview } from "@/features/content/components/content-preview";
import { CreateSectionForm } from "@/features/content/components/section-form";
import { SectionList } from "@/features/content/components/section-list";
import { MaintenanceCodeEditor } from "@/features/projects/components/maintenance-code-editor";
import { getMaintenanceCodeEditor, getMaintenanceReleasePage } from "@/features/projects/services/project-maintenance.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ProjectMaintenanceReleasePage({ params }: { params: Promise<{ projectId: string; releaseId: string }> }) {
  const actor = await requirePermission(permissions.projectsWrite);
  const { projectId, releaseId } = await params;
  let release;
  let codeEditor;
  try {
    release = await getMaintenanceReleasePage(projectId, releaseId, actor);
    codeEditor = await getMaintenanceCodeEditor(projectId, releaseId, actor);
  } catch {
    notFound();
  }
  const page = release.candidatePage;
  const editable = release.status !== "PUBLISHED";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-primary text-sm underline-offset-4 hover:underline" href={`/projects/${projectId}`}>Voltar ao projeto</Link>
          <CmsPageHeader eyebrow={`Release v${release.version}`} title={page.title} description={release.changeSummary} />
        </div>
        <Badge tone={release.status === "PUBLISHED" ? "success" : release.status === "FAILED" ? "error" : release.status === "VALIDATED" ? "info" : "warning"}>{release.status}</Badge>
      </div>
      <Alert tone={editable ? "warning" : "success"} title={editable ? "Cópia candidata isolada" : "Release publicada e imutável"}>
        {editable ? "As edições ficam nesta cópia. Qualquer alteração invalida a validação e exige novo build e auditoria. A página permanece em rascunho e nunca é publicada diretamente pelo CMS." : "Esta versão publicada é preservada. Para recuperar uma release anterior, prepara uma nova versão candidata a partir do respetivo snapshot."}
      </Alert>
      <div><Link href={`/projects/${projectId}/maintenance/${releaseId}/preview`}><Button variant="outline">Pré-visualizar landing</Button></Link></div>
      {editable ? <CreateSectionForm pageId={page.id} /> : null}
      <SectionList canWrite={editable} sections={page.sections} templateKey={page.template?.key} templateVariantKey={page.templateVariant?.key} />
      <MaintenanceCodeEditor projectId={projectId} releaseId={releaseId} editable={editable && codeEditor.editable} files={codeEditor.files} />
      <section aria-labelledby="candidate-preview-heading" className="grid gap-3">
        <h2 id="candidate-preview-heading" className="text-lg font-semibold">Revisão do conteúdo guardado</h2>
        <ContentPreview sections={page.sections} />
      </section>
      <div>
        <Link href={`/projects/${projectId}`}><Button variant="outline">Histórico e validação</Button></Link>
      </div>
    </div>
  );
}
