import { DemoStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Grid } from "@/components/ui/layout";

export function DemoFilterBar({
  filters,
  industries,
  templates,
}: {
  filters: {
    search?: string;
    status?: DemoStatus;
    industryId?: string;
    templateId?: string;
    templateVariantId?: string;
  };
  industries: Array<{ id: string; name: string }>;
  templates: Array<{
    id: string;
    name: string;
    industryId: string;
    variants: Array<{ id: string; name: string }>;
  }>;
}) {
  return (
    <form className="border-border bg-surface-elevated rounded-md border p-4">
      <Grid className="md:grid-cols-5">
        <Field>
          <Label htmlFor="demo-search">Pesquisa</Label>
          <Input
            defaultValue={filters.search ?? ""}
            id="demo-search"
            name="search"
            placeholder="Nome, slug, industria"
          />
        </Field>
        <Field>
          <Label htmlFor="demo-status">Estado</Label>
          <Select defaultValue={filters.status ?? ""} id="demo-status" name="status">
            <option value="">Todos</option>
            {Object.values(DemoStatus).map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="demo-industry">Industria</Label>
          <Select defaultValue={filters.industryId ?? ""} id="demo-industry" name="industryId">
            <option value="">Todas</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="demo-template">Template</Label>
          <Select defaultValue={filters.templateId ?? ""} id="demo-template" name="templateId">
            <option value="">Todos</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="demo-variant">Variante</Label>
          <Select
            defaultValue={filters.templateVariantId ?? ""}
            id="demo-variant"
            name="templateVariantId"
          >
            <option value="">Todas</option>
            {templates.flatMap((template) =>
              template.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {template.name} / {variant.name}
                </option>
              )),
            )}
          </Select>
        </Field>
      </Grid>
      <Button className="mt-4" type="submit" variant="outline">
        Aplicar filtros
      </Button>
    </form>
  );
}
