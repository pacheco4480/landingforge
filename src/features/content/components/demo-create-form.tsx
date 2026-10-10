import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Grid, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";
import { createDemoAction } from "@/features/content/actions/demo.actions";

export function DemoCreateForm({
  templates,
  themes,
}: {
  templates: Array<{
    id: string;
    name: string;
    variants: Array<{ id: string; name: string }>;
  }>;
  themes: Array<{ id: string; name: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar demo</CardTitle>
        <CardDescription>Cria uma landing page interna isolada.</CardDescription>
      </CardHeader>
      <ActionFeedbackForm
        action={createDemoAction}
        className="grid gap-4"
        loadingMessage="A criar demo..."
        successMessage="Demo criada."
      >
        <Grid className="md:grid-cols-3">
          <Field>
            <Label htmlFor="demo-title">Nome</Label>
            <Input id="demo-title" name="title" required />
          </Field>
          <Field>
            <Label htmlFor="demo-slug">Slug</Label>
            <Input id="demo-slug" name="slug" required />
          </Field>
          <Field>
            <Label htmlFor="demo-key">Demo key</Label>
            <Input id="demo-key" name="demoKey" required />
          </Field>
        </Grid>
        <Grid className="md:grid-cols-3">
          <Field>
            <Label htmlFor="templateId">Template</Label>
            <Select id="templateId" name="templateId">
              <option value="">Sem template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="templateVariantId">Variante</Label>
            <Select id="templateVariantId" name="templateVariantId">
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
          <Field>
            <Label htmlFor="themeId">Theme</Label>
            <Select id="themeId" name="themeId">
              <option value="">Sem tema</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </Select>
          </Field>
        </Grid>
        <Button type="submit">Criar demo</Button>
      </ActionFeedbackForm>
    </Card>
  );
}
