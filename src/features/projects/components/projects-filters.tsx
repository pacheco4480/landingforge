import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { ProjectStatus } from "@/generated/prisma/client";

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEFING]: "Briefing",
  [ProjectStatus.CONTENT_COLLECTION]: "Recolha de conteúdos",
  [ProjectStatus.PLANNING]: "Planeamento",
  [ProjectStatus.DEVELOPMENT]: "Desenvolvimento",
  [ProjectStatus.REVIEW]: "Revisão",
  [ProjectStatus.APPROVED]: "Aprovado",
  [ProjectStatus.DELIVERED]: "Entregue",
  [ProjectStatus.MAINTENANCE]: "Manutenção",
  [ProjectStatus.ARCHIVED]: "Arquivado",
};

export function ProjectsFilters({
  industries,
  filters,
}: {
  industries: { id: string; name: string }[];
  filters: {
    query: string;
    industryId: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}) {
  return (
    <form method="get" className="border-border grid gap-4 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Field>
          <Label htmlFor="project-query">Projeto, cliente ou template</Label>
          <Input
            id="project-query"
            name="q"
            defaultValue={filters.query}
            maxLength={100}
            placeholder="Pesquisar"
          />
        </Field>
        <Field>
          <Label htmlFor="project-industry">Indústria</Label>
          <Select id="project-industry" name="industry" defaultValue={filters.industryId}>
            <option value="">Todas</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>{industry.name}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="project-status">Estado</Label>
          <Select id="project-status" name="status" defaultValue={filters.status}>
            <option value="">Todos</option>
            {Object.values(ProjectStatus).map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="project-date-from">Atualizado desde</Label>
          <Input id="project-date-from" name="from" type="date" defaultValue={filters.dateFrom} />
        </Field>
        <Field>
          <Label htmlFor="project-date-to">Atualizado até</Label>
          <Input id="project-date-to" name="to" type="date" defaultValue={filters.dateTo} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Filtrar projetos</Button>
        <Link href="/projects" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}
