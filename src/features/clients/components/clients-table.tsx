import Link from "next/link";

import { EmptyState, Table } from "@/components/ui/data-display";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ClientFilters } from "@/features/clients/schemas/client-filter.schema";
import type { ClientStatus } from "@/generated/prisma/client";

type ClientRow = {
  id: string;
  name: string;
  businessName: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  updatedAt: Date;
  _count: { projects: number };
};

export function ClientsTable({
  clients,
  canCreate,
  filtersApplied,
  pagination,
  filters,
}: {
  clients: ClientRow[];
  canCreate: boolean;
  filtersApplied: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ClientFilters;
}) {
  if (!clients.length) {
    return (
      <EmptyState
        title={
          filtersApplied
            ? "Não foram encontrados clientes"
            : "Ainda não existem clientes"
        }
        description={
          filtersApplied
            ? "Altera os filtros ou limpa a pesquisa para ver outros resultados."
            : "Cria um registo para centralizar os dados comerciais e iniciar um projeto."
        }
        action={
          !filtersApplied && canCreate ? (
            <Link href="/clients/new">
              <Button>
                <Plus aria-hidden="true" /> Criar cliente
              </Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.industry) params.set("industry", filters.industry);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(page));
    return `/clients?${params.toString()}`;
  };

  return (
    <div className="grid gap-3">
      <Table caption="Clientes internos">
        <thead className="border-border text-muted-foreground border-b text-xs uppercase">
          <tr>
            <th scope="col" className="px-3 py-2">
              Empresa
            </th>
            <th scope="col" className="px-3 py-2">
              Contacto
            </th>
            <th scope="col" className="px-3 py-2">
              Setor
            </th>
            <th scope="col" className="px-3 py-2">
              Projetos
            </th>
            <th scope="col" className="px-3 py-2">
              Estado
            </th>
            <th scope="col" className="px-3 py-2">
              Atualizado
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              className="border-border border-b last:border-0"
            >
              <td className="px-3 py-3">
                <Link
                  href={`/clients/${client.id}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {client.businessName}
                </Link>
              </td>
              <td className="px-3 py-3 text-sm">
                <div>{client.name}</div>
                {client.email ? (
                  <div className="text-muted-foreground">{client.email}</div>
                ) : null}
              </td>
              <td className="text-muted-foreground px-3 py-3 text-sm">
                {client.industry || "—"}
              </td>
              <td className="px-3 py-3 text-sm">{client._count.projects}</td>
              <td className="px-3 py-3">
                <ClientStatusBadge status={client.status} />
              </td>
              <td className="text-muted-foreground px-3 py-3 text-sm">
                {client.updatedAt.toLocaleDateString("pt-PT")}
              </td>
              <td className="px-3 py-3">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <nav
        aria-label="Paginação de clientes"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {pagination.total} {pagination.total === 1 ? "cliente" : "clientes"}
          {pagination.totalPages > 0
            ? ` · Página ${pagination.page} de ${pagination.totalPages}`
            : ""}
        </p>
        <div className="flex items-center gap-2">
          {pagination.page > 1 ? (
            <Link
              href={pageHref(pagination.page - 1)}
              rel="prev"
              className="border-border rounded-md border px-3 py-2 text-sm underline-offset-4 hover:underline"
            >
              Anterior
            </Link>
          ) : null}
          {pagination.page < pagination.totalPages ? (
            <Link
              href={pageHref(pagination.page + 1)}
              rel="next"
              className="border-border rounded-md border px-3 py-2 text-sm underline-offset-4 hover:underline"
            >
              Seguinte
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
