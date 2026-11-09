import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, FieldMessage, Input, Label, Select } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import { PageStatus, PageType } from "@/generated/prisma/client";
import {
  createPageAction,
  updatePageAction,
} from "@/features/content/actions/page.actions";

type TemplateOption = {
  id: string;
  name: string;
  variants: Array<{ id: string; name: string }>;
};

type PageFormValue = {
  id?: string;
  title?: string;
  slug?: string;
  status?: PageStatus;
  pageType?: PageType;
  templateId?: string | null;
  templateVariantId?: string | null;
};

const pageStatusLabels: Record<PageStatus, string> = {
  [PageStatus.DRAFT]: "Rascunho",
  [PageStatus.PUBLISHED]: "Publicada",
  [PageStatus.ARCHIVED]: "Arquivada",
};

const pageTypeLabels: Record<PageType, string> = {
  [PageType.LANDING]: "Landing page",
  [PageType.LEGAL]: "Página legal",
  [PageType.THANK_YOU]: "Página de confirmação",
  [PageType.CUSTOM]: "Página personalizada",
};

export function PageForm({
  page,
  templates,
}: {
  page?: PageFormValue;
  templates: TemplateOption[];
}) {
  const action = page?.id ? updatePageAction : createPageAction;

  return (
    <Card>
      <ActionFeedbackForm
        action={action}
        loadingMessage="A guardar página..."
        successMessage="Página guardada."
      >
        {page?.id ? <input name="id" type="hidden" value={page.id} /> : null}
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                defaultValue={page?.title ?? ""}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={page?.slug ?? ""}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
              <FieldMessage>
                O slug define o endereço público. Usa apenas letras minúsculas,
                números e hífenes.
              </FieldMessage>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                name="status"
                defaultValue={page?.status ?? PageStatus.DRAFT}
              >
                {Object.values(PageStatus).map((status) => (
                  <option key={status} value={status}>
                    {pageStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="pageType">Tipo de página</Label>
              <Select
                id="pageType"
                name="pageType"
                defaultValue={page?.pageType ?? PageType.LANDING}
              >
                {Object.values(PageType).map((pageType) => (
                  <option key={pageType} value={pageType}>
                    {pageTypeLabels[pageType]}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="templateId">Modelo</Label>
              <Select
                id="templateId"
                name="templateId"
                defaultValue={page?.templateId ?? ""}
              >
                <option value="">Sem modelo</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="templateVariantId">Variante</Label>
              <Select
                id="templateVariantId"
                name="templateVariantId"
                defaultValue={page?.templateVariantId ?? ""}
              >
                <option value="">Sem variante</option>
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
          <div>
            <Button type="submit">
              {page?.id ? "Guardar página" : "Criar página"}
            </Button>
          </div>
        </Stack>
      </ActionFeedbackForm>
    </Card>
  );
}
