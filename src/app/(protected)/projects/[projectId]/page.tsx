import Link from "next/link";
import { notFound } from "next/navigation";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { getClientForActor } from "@/features/clients/services/client.service";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ProjectProvisioningPanel } from "@/features/projects/components/project-provisioning-panel";
import { ClientPackageExportPanel } from "@/features/exports/components/client-package-export-panel";
import { listClientPackageExports } from "@/features/exports/services/client-package-export.service";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { ProjectBriefingWorkspace } from "@/features/briefings/components/project-briefing-workspace";
import { ProjectMaintenancePanel } from "@/features/projects/components/project-maintenance-panel";
import { listProjectMaintenanceReleases, listProjectTemplateRebaseSources } from "@/features/projects/services/project-maintenance.service";
import {
  getProjectForActor,
  getProjectOptions,
} from "@/features/projects/services/project.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requirePermission(permissions.projectsRead);
  const { projectId } = await params;
  let project;
  try {
    project = await getProjectForActor(projectId, user);
    await getClientForActor(project.clientId, user, false);
  } catch {
    notFound();
  }
  const canWrite = user.permissions.includes(permissions.projectsWrite);
  const canExport = user.permissions.includes(permissions.projectsExport);
  const [options] = canWrite
    ? await Promise.all([getProjectOptions(user)])
    : [null];
  const exportHistory = canExport
    ? await listClientPackageExports(project.id, user)
    : [];
  const [maintenanceReleases, templateRebaseSources] = canWrite && project.deliveryMode === "LANDING_ONLY" && project.maintenancePlan !== "NONE"
    ? await Promise.all([
        listProjectMaintenanceReleases(project.id, user),
        listProjectTemplateRebaseSources(project.id, user),
      ])
    : [[], []];

  return (
    <div className="grid gap-6">
      <div>
        <Link
          className="text-primary text-sm underline-offset-4 hover:underline"
          href="/projects"
        >
          Voltar a projetos
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CmsPageHeader
            eyebrow="Projeto"
            title={project.name}
            description={`Cliente: ${project.client.businessName}`}
          />
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>
      {canWrite && options ? (
        <ProjectForm
          project={project}
          options={options}
          canAssign={user.permissions.includes(permissions.projectsAssign)}
          currentUserId={user.id}
        />
      ) : (
        <section className="border-border bg-surface-elevated grid gap-4 rounded-md border p-5 sm:grid-cols-2">
          <p>
            <strong>Serviço:</strong> {project.serviceType.replaceAll("_", " ")}
          </p>
          <p>
            <strong>Entrega:</strong>{" "}
            {project.deliveryMode === "LANDING_WITH_CMS"
              ? "Landing + CMS"
              : "Landing sem CMS"}
          </p>
          <p>
            <strong>Template:</strong> {project.template?.name ?? "A definir"}
          </p>
          <p>
            <strong>Variante:</strong>{" "}
            {project.templateVariant?.name ?? "A definir"}
          </p>
          <p>
            <strong>Responsável pela gestão:</strong>{" "}
            {project.siteManagementOwner}
          </p>
          <p>
            <strong>Manutenção:</strong> {project.maintenancePlan}
          </p>
        </section>
      )}
      <section className="border-border rounded-md border p-5">
        <h2 className="font-semibold">Responsáveis internos</h2>
        {project.assignments.length ? (
          <ul className="text-muted-foreground mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {project.assignments.map(({ user: assignee }) => (
              <li key={assignee.id}>
                {assignee.name} · {assignee.email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            Sem responsáveis atribuídos. Só utilizadores com acesso global podem
            gerir o projeto até ser atribuído.
          </p>
        )}
      </section>
      <ProjectProvisioningPanel
        projectId={project.id}
        templateName={project.template?.name ?? null}
        variantName={project.templateVariant?.name ?? null}
        page={project.sourceVersions[0]?.provisionedPage ?? null}
        sourceVersion={project.sourceVersions[0] ?? null}
        canWrite={canWrite}
        canEditPages={user.permissions.includes(permissions.pagesWrite)}
      />
      <ProjectBriefingWorkspace
        projectId={project.id}
        actor={user}
        canWrite={canWrite}
        canUseMedia={user.permissions.includes(permissions.mediaRead)}
      />
      {canWrite && project.deliveryMode === "LANDING_ONLY" && project.maintenancePlan !== "NONE" ? (
        <ProjectMaintenancePanel
          projectId={project.id}
          maintenancePlan={project.maintenancePlan}
          maintenanceScope={project.maintenanceScope}
          releases={maintenanceReleases}
          rebaseSources={templateRebaseSources}
        />
      ) : null}
      {canExport ? (
        <ClientPackageExportPanel
          projectId={project.id}
          mode={project.deliveryMode}
          canExport={
            project.status === "APPROVED" || project.status === "DELIVERED"
          }
          history={exportHistory}
        />
      ) : null}
      <p className="text-muted-foreground text-sm">
        A cópia provisionada é a fonte privada de trabalho. A entrega ao cliente
        é gerada separadamente, auditada e disponibilizada apenas no modo
        contratado.
      </p>
    </div>
  );
}
