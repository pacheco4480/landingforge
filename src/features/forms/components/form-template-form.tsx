import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { createFormFromTemplateAction } from "@/features/forms/actions/form.actions";
import { formTemplates } from "@/features/forms/services/form-template.service";

type PageOption = { id: string; title: string; slug: string };

export function FormTemplateForm({
  pages,
  canWrite,
}: {
  pages: PageOption[];
  canWrite: boolean;
}) {
  if (!canWrite) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Template</CardTitle>
        <CardDescription>
          Create a form from a conversion-focused starter.
        </CardDescription>
      </CardHeader>
      <ActionFeedbackForm
        action={createFormFromTemplateAction}
        className="grid gap-4"
        loadingMessage="A criar formulário..."
        successMessage="Formulário criado."
      >
        <Grid className="md:grid-cols-3">
          <Field>
            <Label htmlFor="templateKey">Template</Label>
            <Select id="templateKey" name="templateKey">
              {Object.entries(formTemplates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="templatePageId">Page</Label>
            <Select id="templatePageId" name="pageId">
              <option value="">Global</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="templateRecipientEmail">Recipient</Label>
            <Input
              id="templateRecipientEmail"
              name="recipientEmail"
              type="email"
              defaultValue="hello@example.com"
              required
            />
          </Field>
        </Grid>
        <Button type="submit">Create from template</Button>
      </ActionFeedbackForm>
    </Card>
  );
}
