import type { LeadStatus } from "@/generated/prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Grid } from "@/components/ui/layout";
import type { LeadFilters } from "@/features/leads/schemas/lead.schema";
import {
  leadStatusLabels,
  leadStatusOrder,
} from "@/features/leads/services/lead-status.service";

export function LeadsFilterBar({
  filters,
  forms,
  sources,
}: {
  filters: LeadFilters;
  forms: Array<{ id: string; name: string }>;
  sources: Array<string | null>;
}) {
  return (
    <form className="border-border bg-surface-elevated rounded-md border p-4">
      <Grid className="lg:grid-cols-6">
        <Field className="lg:col-span-2">
          <Label htmlFor="lead-search">Pesquisar</Label>
          <Input
            id="lead-search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Nome, email ou telefone"
          />
        </Field>
        <Field>
          <Label htmlFor="lead-status">Estado</Label>
          <Select
            id="lead-status"
            name="status"
            defaultValue={filters.status ?? ""}
          >
            <option value="">Todos</option>
            {leadStatusOrder.map((status) => (
              <option key={status} value={status}>
                {leadStatusLabels[status as LeadStatus]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="lead-date">Período</Label>
          <Select id="lead-date" name="date" defaultValue={filters.date}>
            <option value="all">Sempre</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="lead-form">Formulário</Label>
          <Select
            id="lead-form"
            name="formId"
            defaultValue={filters.formId ?? ""}
          >
            <option value="">Todos</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="lead-source">Origem</Label>
          <Select
            id="lead-source"
            name="source"
            defaultValue={filters.source ?? ""}
          >
            <option value="">Todas</option>
            {sources.map((source) =>
              source ? (
                <option key={source} value={source}>
                  {source}
                </option>
              ) : null,
            )}
          </Select>
        </Field>
      </Grid>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field className="w-44">
          <Label htmlFor="lead-sort">Ordenar por</Label>
          <Select id="lead-sort" name="sort" defaultValue={filters.sort}>
            <option value="createdAt">Data</option>
            <option value="name">Nome</option>
            <option value="status">Estado</option>
          </Select>
        </Field>
        <Field className="w-40">
          <Label htmlFor="lead-direction">Direção</Label>
          <Select
            id="lead-direction"
            name="direction"
            defaultValue={filters.direction}
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </Select>
        </Field>
        <Button type="submit">Aplicar filtros</Button>
        <Link
          className="border-border bg-background text-foreground hover:bg-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors"
          href="/leads"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
