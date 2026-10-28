import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/data-display";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProjectsTable } from "@/features/projects/components/projects-table";
import { ProjectsFilters } from "@/features/projects/components/projects-filters";
import { getProjectFilterOptions, getProjectsWorkspace } from "@/features/projects/services/project.service";
import { ProjectStatus } from "@/generated/prisma/client";
import { parseProjectFilters, type ProjectFilters } from "@/features/projects/schemas/project-filter.schema";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEFING]: "Briefings",
  [ProjectStatus.CONTENT_COLLECTION]: "A aguardar conteúdos",
  [ProjectStatus.PLANNING]: "Em planeamento",
  [ProjectStatus.DEVELOPMENT]: "Em desenvolvimento",
  [ProjectStatus.REVIEW]: "Em revisão",
  [ProjectStatus.APPROVED]: "Aprovados",
  [ProjectStatus.DELIVERED]: "Entregues",
  [ProjectStatus.MAINTENANCE]: "Em manutenção",
  [ProjectStatus.ARCHIVED]: "Arquivados",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissions.projectsRead);
  const params = await searchParams;
  const parsedFilters = parseProjectFilters(params);
  const filters: ProjectFilters = parsedFilters.success
    ? parsedFilters.data
    : { q: undefined, industry: undefined, status: undefined, from: undefined, to: undefined };
  const [workspace, industries] = await Promise.all([
    getProjectsWorkspace(user, {
      query: filters.q,
      industryId: filters.industry,
      status: filters.status,
      dateFrom: filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : undefined,
      dateTo: filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : undefined,
    }),
    getProjectFilterOptions(),
  ]);
  const canCreate = user.permissions.includes(permissions.projectsWrite);
  const activeCount = workspace.metrics
    .filter((item) => item.status !== ProjectStatus.ARCHIVED)
    .reduce((total, item) => total + item.count, 0);
  const pendingStatuses: ProjectStatus[] = [
    ProjectStatus.BRIEFING,
    ProjectStatus.CONTENT_COLLECTION,
    ProjectStatus.REVIEW,
  ];
  const pendingCount = workspace.metrics
    .filter((item) => pendingStatuses.includes(item.status))
    .reduce((total, item) => total + item.count, 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CmsPageHeader eyebrow="Entrega" title="Projetos" description="Acompanha âmbito, estado, responsabilidades de publicação e manutenção de cada entrega." />
        {canCreate ? <Link href="/projects/new"><Button><Plus aria-hidden="true" /> Novo projeto</Button></Link> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Projetos ativos" value={String(activeCount)} helper="Registos visíveis segundo as tuas permissões." />
        <StatCard label="Ação pendente" value={String(pendingCount)} helper="Briefings, conteúdos ou revisões por acompanhar." />
      </div>
      <ProjectsFilters
        industries={industries}
        filters={{
          query: filters.q ?? "",
          industryId: filters.industry ?? "",
          status: filters.status ?? "",
          dateFrom: filters.from ?? "",
          dateTo: filters.to ?? "",
        }}
      />
      {!parsedFilters.success ? (
        <p className="text-warning text-sm" role="status">
          Alguns filtros eram inválidos e foram ignorados. Revê os valores e tenta novamente.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workspace.metrics.filter((item) => item.count > 0).map((item) => (
          <StatCard key={item.status} label={statusLabels[item.status]} value={String(item.count)} />
        ))}
      </div>
      <ProjectsTable projects={workspace.projects} canCreate={canCreate} />
    </div>
  );
}
