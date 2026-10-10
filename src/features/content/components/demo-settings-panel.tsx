import { DemoStatus, PageStatus } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Label, Select } from "@/components/ui/form";
import { Card, CardDescription, CardHeader, CardTitle, Grid } from "@/components/ui/layout";
import { updateDemoSettingsAction } from "@/features/content/actions/demo.actions";

type Option = { id: string; name: string; variants?: Option[] };

export function DemoSettingsPanel({
  page,
  templates,
  themes,
}: {
  page: {
    id: string;
    title: string;
    slug: string;
    demoKey: string | null;
    status: PageStatus;
    demoStatus: DemoStatus | null;
    portfolioVisible: boolean;
    portfolioOrder: number | null;
    templateId: string | null;
    templateVariantId: string | null;
    themeId: string | null;
  };
  templates: Option[];
  themes: Option[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Settings</CardTitle>
        <CardDescription>Switch template, variant, theme and portfolio state without affecting client pages.</CardDescription>
      </CardHeader>
      <ActionFeedbackForm action={updateDemoSettingsAction} className="grid gap-4" loadingMessage="A guardar demo..." successMessage="Demo guardada.">
        <input name="id" type="hidden" value={page.id} />
        <Grid className="md:grid-cols-3">
          <Field><Label htmlFor="demo-title">Title</Label><Input id="demo-title" name="title" defaultValue={page.title} required /></Field>
          <Field><Label htmlFor="demo-slug">Slug</Label><Input id="demo-slug" name="slug" defaultValue={page.slug} required /></Field>
          <Field><Label htmlFor="demo-key">Demo key</Label><Input id="demo-key" name="demoKey" defaultValue={page.demoKey ?? ""} required /></Field>
        </Grid>
        <Grid className="md:grid-cols-4">
          <Field>
            <Label htmlFor="demo-status">Demo status</Label>
            <Select id="demo-status" name="demoStatus" defaultValue={page.demoStatus ?? DemoStatus.DRAFT}>
              {Object.values(DemoStatus).map((status) => <option key={status} value={status}>{status.toLowerCase()}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="page-status">Public status</Label>
            <Select id="page-status" name="pageStatus" defaultValue={page.status}>
              {Object.values(PageStatus).map((status) => <option key={status} value={status}>{status.toLowerCase()}</option>)}
            </Select>
          </Field>
          <Field><Label htmlFor="portfolioOrder">Portfolio order</Label><Input id="portfolioOrder" name="portfolioOrder" type="number" defaultValue={page.portfolioOrder ?? ""} /></Field>
          <label className="mt-8 flex items-center gap-2 text-sm font-medium">
            <Checkbox name="portfolioVisible" defaultChecked={page.portfolioVisible} />
            Show in portfolio
          </label>
        </Grid>
        <Grid className="md:grid-cols-3">
          <Field>
            <Label htmlFor="templateId">Template</Label>
            <Select id="templateId" name="templateId" defaultValue={page.templateId ?? ""}>
              <option value="">No template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="templateVariantId">Variant</Label>
            <Select id="templateVariantId" name="templateVariantId" defaultValue={page.templateVariantId ?? ""}>
              <option value="">No variant</option>
              {templates.flatMap((template) => (template.variants ?? []).map((variant) => <option key={variant.id} value={variant.id}>{template.name} / {variant.name}</option>))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="themeId">Theme</Label>
            <Select id="themeId" name="themeId" defaultValue={page.themeId ?? ""}>
              <option value="">No theme</option>
              {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </Select>
          </Field>
        </Grid>
        <Button type="submit">Save demo settings</Button>
      </ActionFeedbackForm>
    </Card>
  );
}
