import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, Table } from "@/components/ui/data-display";
import { Badge } from "@/components/ui/feedback";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { ProjectDeliveryMode } from "@/generated/prisma/client";

type ProjectRow = {
  id: string;
  name: string;
  status: Parameters<typeof ProjectStatusBadge>[0]["status"];
  priority: string;
  deliveryMode: ProjectDeliveryMode;
  updatedAt: Date;
  client: { id: string; businessName: string };
  template: { name: string } | null;
  templateVariant: { name: string } | null;
};

export function ProjectsTable({ projects, canCreate }: { projects: ProjectRow[]; canCreate: boolean }) {
  if (!projects.length) {
    return (
      <EmptyState
        title="Ainda não existem projetos"
        description="Cria um projeto para definir âmbito, responsáveis e modalidade de entrega."
        action={canCreate ? <Link href="/projects/new"><Button><Plus aria-hidden="true" /> Criar projeto</Button></Link> : undefined}
      />
    );
  }

  return (
    <Table caption="Projetos de clientes">
      <thead className="border-border text-muted-foreground border-b text-xs uppercase">
        <tr>
          <th scope="col" className="px-3 py-2">Projeto</th>
          <th scope="col" className="px-3 py-2">Cliente</th>
          <th scope="col" className="px-3 py-2">Template</th>
          <th scope="col" className="px-3 py-2">Entrega</th>
          <th scope="col" className="px-3 py-2">Prioridade</th>
          <th scope="col" className="px-3 py-2">Estado</th>
          <th scope="col" className="px-3 py-2"><span className="sr-only">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id} className="border-border border-b last:border-0">
            <td className="px-3 py-3 font-semibold">{project.name}</td>
            <td className="px-3 py-3 text-sm"><Link href={`/clients/${project.client.id}`} className="underline-offset-4 hover:underline">{project.client.businessName}</Link></td>
            <td className="px-3 py-3 text-sm">{project.template?.name ?? "A definir"}{project.templateVariant ? <span className="text-muted-foreground block">{project.templateVariant.name}</span> : null}</td>
            <td className="px-3 py-3 text-sm">{project.deliveryMode === ProjectDeliveryMode.LANDING_WITH_CMS ? "Landing + CMS" : "Landing"}</td>
            <td className="px-3 py-3"><Badge tone={project.priority === "HIGH" ? "warning" : "neutral"}>{project.priority === "HIGH" ? "Alta" : project.priority === "LOW" ? "Baixa" : "Normal"}</Badge></td>
            <td className="px-3 py-3"><ProjectStatusBadge status={project.status} /></td>
            <td className="px-3 py-3"><Link href={`/projects/${project.id}`} className="text-primary text-sm font-semibold underline-offset-4 hover:underline">Abrir</Link></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
