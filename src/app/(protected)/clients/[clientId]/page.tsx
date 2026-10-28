import Link from "next/link";
import { notFound } from "next/navigation";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ClientForm } from "@/features/clients/components/client-form";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import { ClientKnowledgeBase } from "@/features/clients/components/client-knowledge-base";
import { getClientForActor } from "@/features/clients/services/client.service";
import { listClientKnowledgeEntries } from "@/features/clients/services/client-knowledge.service";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requirePermission(permissions.clientsRead);
  const { clientId } = await params;
  let client;
  try {
    client = await getClientForActor(
      clientId,
      user,
      user.permissions.includes(permissions.clientNotesRead),
    );
  } catch {
    notFound();
  }
  const canWrite = user.permissions.includes(permissions.clientsWrite);
  const canReadKnowledge = user.permissions.includes(permissions.clientNotesRead);
  const canWriteKnowledge =
    canReadKnowledge && user.permissions.includes(permissions.clientNotesWrite);
  const knowledgeEntries = canReadKnowledge
    ? await listClientKnowledgeEntries(client.id, user)
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <Link className="text-primary text-sm underline-offset-4 hover:underline" href="/clients">Voltar a clientes</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CmsPageHeader eyebrow="CRM interno" title={client.businessName} description={`${client.name}${client.industry ? ` · ${client.industry}` : ""}`} />
          <ClientStatusBadge status={client.status} />
        </div>
      </div>
      {canWrite ? <ClientForm
        client={client}
        canEditNotes={
          user.permissions.includes(permissions.clientNotesRead) &&
          user.permissions.includes(permissions.clientNotesWrite)
        }
      /> : (
        <section className="border-border bg-surface-elevated grid gap-3 rounded-md border p-5 text-sm sm:grid-cols-2">
          <p><strong>Email:</strong> {client.email || "—"}</p>
          <p><strong>Telefone:</strong> {client.phone || "—"}</p>
          <p><strong>Website:</strong> {client.website || "—"}</p>
          <p><strong>NIF / NIPC:</strong> {client.vatNumber || "—"}</p>
          <p className="sm:col-span-2"><strong>Morada:</strong> {client.address || "—"}</p>
        </section>
      )}
      {"internalNotes" in client && client.internalNotes ? (
        <section className="border-border rounded-md border p-5">
          <h2 className="font-semibold">Notas internas</h2>
          <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">{client.internalNotes}</p>
        </section>
      ) : null}
      {canReadKnowledge ? (
        <ClientKnowledgeBase
          clientId={client.id}
          entries={knowledgeEntries}
          projects={client.projects.map(({ id, name }) => ({ id, name }))}
          canWrite={canWriteKnowledge}
        />
      ) : null}
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Projetos</h2>
          {user.permissions.includes(permissions.projectsWrite) ? <Link className="text-primary text-sm font-semibold underline-offset-4 hover:underline" href={`/projects/new?clientId=${client.id}`}>Novo projeto</Link> : null}
        </div>
        {client.projects.length ? (
          <ul className="divide-border divide-y border-y">
            {client.projects.map((project) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={project.id}>
                <Link className="font-medium underline-offset-4 hover:underline" href={`/projects/${project.id}`}>{project.name}</Link>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{project.deliveryMode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing"}</span>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">Ainda não existem projetos associados a este cliente.</p>}
      </section>
    </div>
  );
}
