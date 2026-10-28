import Link from "next/link";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectOptions } from "@/features/projects/services/project.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await requirePermission(permissions.projectsWrite);
  const [options, query] = await Promise.all([getProjectOptions(user), searchParams]);
  const clients = options.clients;
  const initialClientId = clients.some((client) => client.id === query.clientId)
    ? query.clientId
    : clients[0]?.id;

  return (
    <div className="grid gap-6">
      <div>
        <Link className="text-primary text-sm underline-offset-4 hover:underline" href="/projects">Voltar a projetos</Link>
        <CmsPageHeader eyebrow="Entrega" title="Novo projeto" description="Define o serviço, o template de origem e quem assume a gestão após a entrega." />
      </div>
      {!clients.length ? (
        <div className="border-border rounded-md border p-5">
          <p className="font-semibold">Cria primeiro um cliente</p>
          <p className="text-muted-foreground mt-1 text-sm">Um projeto tem de pertencer a um cliente existente.</p>
          <Link className="text-primary mt-3 inline-block text-sm font-semibold underline-offset-4 hover:underline" href="/clients/new">Criar cliente</Link>
        </div>
      ) : (
        <ProjectForm
          options={options}
          canAssign={user.permissions.includes(permissions.projectsAssign)}
          currentUserId={user.id}
          project={initialClientId ? { clientId: initialClientId } : undefined}
        />
      )}
    </div>
  );
}
