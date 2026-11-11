import { FormFieldType, type FormField } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  Input,
  Label,
} from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { saveFormFieldAction } from "@/features/forms/actions/form-field.actions";
import { FormFieldConfiguration } from "@/features/forms/components/form-field-configuration";

export function FieldEditor({
  formId,
  canWrite,
  fields,
}: {
  formId: string;
  canWrite: boolean;
  fields: Pick<FormField, "name" | "label">[];
}) {
  if (!canWrite) return null;
  return (
    <Card>
      <CardHeader>
      <CardTitle>Adicionar campo</CardTitle>
      <CardDescription>Configure um campo reutilizável do formulário.</CardDescription>
      </CardHeader>
      <FieldForm formId={formId} fields={fields} key={formId} />
    </Card>
  );
}

export function FieldForm({
  formId,
  field,
  fields = [],
}: {
  formId: string;
  field?: FormField;
  fields?: Pick<FormField, "name" | "label">[];
}) {
  const fieldId = field?.id ?? "new";

  return (
    <ActionFeedbackForm
      action={saveFormFieldAction}
      className="grid gap-4"
      loadingMessage="A guardar campo..."
      successMessage="Campo guardado."
      preventDuplicateSubmit
    >
      <input name="formId" type="hidden" value={formId} />
      {field ? <input name="id" type="hidden" value={field.id} /> : null}
      <Grid className="min-w-0 sm:grid-cols-2 xl:grid-cols-3">
        <Field className="min-w-0">
          <Label htmlFor={`label-${field?.id ?? "new"}`}>Rótulo</Label>
          <Input
            id={`label-${field?.id ?? "new"}`}
            name="label"
            aria-describedby={`label-help-${fieldId}`}
            defaultValue={field?.label ?? ""}
            required
          />
          <p
            className="text-muted-foreground text-xs"
            id={`label-help-${fieldId}`}
          >
            Texto visível para o visitante, por exemplo <code>Email</code>.
          </p>
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`name-${field?.id ?? "new"}`}>Identificador</Label>
          <Input
            id={`name-${field?.id ?? "new"}`}
            name="name"
            aria-describedby={`name-help-${fieldId}`}
            defaultValue={field?.name ?? ""}
            required
          />
          <p
            className="text-muted-foreground text-xs"
            id={`name-help-${fieldId}`}
          >
            Chave interna sem espaços, por exemplo email, phone ou message.
          </p>
        </Field>
      </Grid>
      <Grid className="min-w-0 sm:grid-cols-2 xl:grid-cols-3">
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-placeholder`}>Texto de exemplo</Label>
          <Input
            id={`field-${fieldId}-placeholder`}
            name="placeholder"
            defaultValue={field?.placeholder ?? ""}
          />
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-help-text`}>Texto de ajuda</Label>
          <Input
            id={`field-${fieldId}-help-text`}
            name="helpText"
            defaultValue={field?.helpText ?? ""}
          />
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-default-value`}>
            Valor predefinido
          </Label>
          <Input
            id={`field-${fieldId}-default-value`}
            name="defaultValue"
            defaultValue={field?.defaultValue ?? ""}
          />
        </Field>
      </Grid>
      <FormFieldConfiguration
        fieldType={field?.type ?? FormFieldType.TEXT}
        options={field?.options ?? []}
        validation={field?.validation ?? {}}
        conditionalLogic={field?.conditionalLogic ?? []}
        fields={fields.filter((candidate) => candidate.name !== field?.name)}
      />
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            name="isRequired"
            defaultChecked={field?.isRequired ?? false}
          />
          Obrigatório
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            name="isVisible"
            defaultChecked={field?.isVisible ?? true}
          />
          Visível
        </label>
      </div>
      <Button type="submit">{field ? "Guardar campo" : "Adicionar campo"}</Button>
    </ActionFeedbackForm>
  );
}
