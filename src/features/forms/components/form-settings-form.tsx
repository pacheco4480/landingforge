import { FormStatus, FormType, type Form } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { saveFormAction } from "@/features/forms/actions/form.actions";

type PageOption = { id: string; title: string; slug: string };

export function FormSettingsForm({
  form,
  pages,
  canWrite,
}: {
  form: Form | null;
  pages: PageOption[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{form ? "Form Settings" : "Create Form"}</CardTitle>
        <CardDescription>
          Core form configuration, status and submission behavior.
        </CardDescription>
      </CardHeader>
      <ActionFeedbackForm
        action={saveFormAction}
        className="grid gap-5"
        loadingMessage="A guardar formulário..."
        successMessage="Formulário guardado."
      >
        {form ? <input name="id" type="hidden" value={form.id} /> : null}
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={form?.name ?? ""}
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              name="key"
              defaultValue={form?.key ?? ""}
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              name="type"
              defaultValue={form?.type ?? FormType.CONTACT}
              disabled={!canWrite}
            >
              {Object.values(FormType).map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={form?.status ?? FormStatus.DRAFT}
              disabled={!canWrite}
            >
              {Object.values(FormStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="pageId">Landing page</Label>
            <Select
              id="pageId"
              name="pageId"
              defaultValue={form?.pageId ?? ""}
              disabled={!canWrite}
            >
              <option value="">Global</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title} /{page.slug}
                </option>
              ))}
            </Select>
            <p className="text-muted-foreground text-xs">
              Escolhe a landing onde este form deve aparecer. Se ficar Global,
              o form existe no CMS mas nao fica anexado a uma pagina especifica.
            </p>
          </Field>
          <Field>
            <Label htmlFor="thankYouPageId">Thank-you page</Label>
            <Select
              id="thankYouPageId"
              name="thankYouPageId"
              defaultValue={form?.thankYouPageId ?? ""}
              disabled={!canWrite}
            >
              <option value="">None</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="recipientEmail">Recipient email</Label>
            <Input
              id="recipientEmail"
              name="recipientEmail"
              type="email"
              defaultValue={form?.recipientEmail ?? ""}
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="redirectUrl">Redirect URL</Label>
            <Input
              id="redirectUrl"
              name="redirectUrl"
              defaultValue={form?.redirectUrl ?? ""}
              disabled={!canWrite}
            />
          </Field>
        </Grid>
        <Field>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={form?.description ?? ""}
            disabled={!canWrite}
          />
        </Field>
        <Grid className="md:grid-cols-[1fr_2fr_0.8fr]">
          <label className="mt-8 flex items-center gap-2 text-sm font-medium">
            <input
              name="gdprConsentRequired"
              type="checkbox"
              defaultChecked={form?.gdprConsentRequired ?? true}
              disabled={!canWrite}
            />
            Consentimento RGPD obrigatorio
          </label>
          <Field>
            <Label htmlFor="gdprConsentLabel">Texto do consentimento</Label>
            <Input
              id="gdprConsentLabel"
              name="gdprConsentLabel"
              defaultValue={
                form?.gdprConsentLabel ??
                "Li e aceito a Politica de Privacidade."
              }
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="gdprConsentVersion">Versao</Label>
            <Input
              id="gdprConsentVersion"
              name="gdprConsentVersion"
              defaultValue={form?.gdprConsentVersion ?? "1.0"}
              disabled={!canWrite}
              required
            />
          </Field>
        </Grid>
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="successMessage">Success message</Label>
            <Textarea
              id="successMessage"
              name="successMessage"
              defaultValue={
                form?.successMessage ??
                "Thank you. We will contact you shortly."
              }
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="errorMessage">Error message</Label>
            <Textarea
              id="errorMessage"
              name="errorMessage"
              defaultValue={
                form?.errorMessage ??
                "We could not send your request. Please try again."
              }
              disabled={!canWrite}
              required
            />
          </Field>
        </Grid>
        {canWrite ? (
          <Button type="submit">{form ? "Save form" : "Create form"}</Button>
        ) : null}
      </ActionFeedbackForm>
    </Card>
  );
}
