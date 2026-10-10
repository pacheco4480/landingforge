import type { AuditFilters } from "@/features/audit/schemas/audit.schema";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Grid } from "@/components/ui/layout";

export function AuditFilterBar({
  actions,
  entityTypes,
  filters,
  users,
}: {
  actions: string[];
  entityTypes: string[];
  filters: AuditFilters;
  users: Array<{ id: string; name: string; email: string }>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value instanceof Date) query.set(key, value.toISOString().slice(0, 10));
    else if (typeof value === "string" && value) query.set(key, value);
  }

  return (
    <form className="border-border bg-surface-elevated rounded-md border p-4">
      <Grid className="md:grid-cols-3 xl:grid-cols-6">
        <Field>
          <Label htmlFor="audit-search">Pesquisa</Label>
          <Input
            id="audit-search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Acao, entidade, utilizador"
          />
        </Field>
        <Field>
          <Label htmlFor="audit-action">Acao</Label>
          <Select id="audit-action" name="action" defaultValue={filters.action ?? ""}>
            <option value="">Todas</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="audit-entity">Entidade</Label>
          <Select
            id="audit-entity"
            name="entityType"
            defaultValue={filters.entityType ?? ""}
          >
            <option value="">Todas</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="audit-user">Utilizador</Label>
          <Select id="audit-user" name="userId" defaultValue={filters.userId ?? ""}>
            <option value="">Todos</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="audit-from">Desde</Label>
          <Input
            id="audit-from"
            name="from"
            type="date"
            defaultValue={filters.from?.toISOString().slice(0, 10) ?? ""}
          />
        </Field>
        <Field>
          <Label htmlFor="audit-to">Ate</Label>
          <Input
            id="audit-to"
            name="to"
            type="date"
            defaultValue={filters.to?.toISOString().slice(0, 10) ?? ""}
          />
        </Field>
      </Grid>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" variant="outline">
          Filtrar logs
        </Button>
        <a
          className="border-border bg-background hover:bg-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold"
          href={`/admin/audit/export?${query.toString()}`}
        >
          Exportar CSV
        </a>
        <a
          className="border-border bg-background hover:bg-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold"
          href={`/admin/audit/export?${query.toString()}&format=json`}
        >
          Exportar JSON
        </a>
      </div>
    </form>
  );
}
