import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { ClientStatus } from "@/generated/prisma/client";

const statusLabels: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "Contacto inicial",
  [ClientStatus.QUALIFIED]: "Qualificado",
  [ClientStatus.PROPOSAL_SENT]: "Proposta enviada",
  [ClientStatus.NEGOTIATION]: "Em negociação",
  [ClientStatus.APPROVED]: "Aprovado",
  [ClientStatus.IN_PROGRESS]: "Em curso",
  [ClientStatus.REVIEW]: "Em revisão",
  [ClientStatus.DELIVERED]: "Entregue",
  [ClientStatus.MAINTENANCE]: "Manutenção",
  [ClientStatus.ARCHIVED]: "Arquivado",
};

export function ClientsFilters({
  filters,
}: {
  filters: {
    query: string;
    industry: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}) {
  return (
    <form
      method="get"
      className="border-border grid gap-4 rounded-md border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Field>
          <Label htmlFor="client-query">Empresa, contacto ou email</Label>
          <Input
            id="client-query"
            name="q"
            defaultValue={filters.query}
            maxLength={100}
            placeholder="Pesquisar"
          />
        </Field>
        <Field>
          <Label htmlFor="client-industry">Setor</Label>
          <Input
            id="client-industry"
            name="industry"
            defaultValue={filters.industry}
            maxLength={80}
            placeholder="Todos os setores"
          />
        </Field>
        <Field>
          <Label htmlFor="client-status">Estado</Label>
          <Select
            id="client-status"
            name="status"
            defaultValue={filters.status}
          >
            <option value="">Todos</option>
            {Object.values(ClientStatus).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="client-date-from">Atualizado desde</Label>
          <Input
            id="client-date-from"
            name="from"
            type="date"
            defaultValue={filters.dateFrom}
          />
        </Field>
        <Field>
          <Label htmlFor="client-date-to">Atualizado até</Label>
          <Input
            id="client-date-to"
            name="to"
            type="date"
            defaultValue={filters.dateTo}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Filtrar clientes</Button>
        <Link
          href="/clients"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}
