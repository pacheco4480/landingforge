import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { ClientsFilters } from "@/features/clients/components/clients-filters";
import {
  parseClientFilters,
  type ClientFilters,
} from "@/features/clients/schemas/client-filter.schema";
import { getClientsWorkspace } from "@/features/clients/services/client.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissions.clientsRead);
  const params = await searchParams;
  const parsedFilters = parseClientFilters(params);
  const filters: ClientFilters = parsedFilters.success
    ? parsedFilters.data
    : {
        q: undefined,
        industry: undefined,
        status: undefined,
        from: undefined,
        to: undefined,
        page: undefined,
      };
  const workspace = await getClientsWorkspace(user, {
    query: filters.q,
    industry: filters.industry,
    status: filters.status,
    dateFrom: filters.from
      ? new Date(`${filters.from}T00:00:00.000Z`)
      : undefined,
    dateTo: filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : undefined,
    page: filters.page,
  });
  const canCreate = user.permissions.includes(permissions.clientsWrite);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CmsPageHeader
          eyebrow="CRM interno"
          title="Clientes"
          description="Centraliza contactos comerciais e acompanha a relação com cada empresa. Este espaço é interno e não é o CRM de leads das landing pages."
        />
        {canCreate ? (
          <Link href="/clients/new">
            <Button>
              <Plus aria-hidden="true" /> Novo cliente
            </Button>
          </Link>
        ) : null}
      </div>
      <ClientsFilters
        filters={{
          query: filters.q ?? "",
          industry: filters.industry ?? "",
          status: filters.status ?? "",
          dateFrom: filters.from ?? "",
          dateTo: filters.to ?? "",
        }}
      />
      {!parsedFilters.success ? (
        <p className="text-warning text-sm" role="status">
          Alguns filtros eram inválidos e foram ignorados. Revê os valores e
          tenta novamente.
        </p>
      ) : null}
      <ClientsTable
        clients={workspace.clients}
        canCreate={canCreate}
        filtersApplied={Boolean(
          filters.q ||
          filters.industry ||
          filters.status ||
          filters.from ||
          filters.to,
        )}
        pagination={workspace.pagination}
        filters={filters}
      />
    </div>
  );
}
