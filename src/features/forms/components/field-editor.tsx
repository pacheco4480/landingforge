import { FormFieldType, type FormField } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { saveFormFieldAction } from "@/features/forms/actions/form-field.actions";

export function FieldEditor({
  formId,
  canWrite,
}: {
  formId: string;
  canWrite: boolean;
}) {
  if (!canWrite) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Field</CardTitle>
        <CardDescription>Configure one reusable form field.</CardDescription>
      </CardHeader>
      <FieldForm formId={formId} />
    </Card>
  );
}

export function FieldForm({
  formId,
  field,
}: {
  formId: string;
  field?: FormField;
}) {
  const fieldId = field?.id ?? "new";

  return (
    <ActionFeedbackForm
      action={saveFormFieldAction}
      className="grid gap-4"
      loadingMessage="A guardar campo..."
      successMessage="Campo guardado."
    >
      <input name="formId" type="hidden" value={formId} />
      {field ? <input name="id" type="hidden" value={field.id} /> : null}
      <Grid className="min-w-0 sm:grid-cols-2 xl:grid-cols-3">
        <Field className="min-w-0">
          <Label htmlFor={`label-${field?.id ?? "new"}`}>Label</Label>
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
            Texto visivel para o visitante, por exemplo <code>Email</code>.
          </p>
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`name-${field?.id ?? "new"}`}>Name</Label>
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
            Chave interna sem espacos, por exemplo email, phone ou message.
          </p>
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`type-${field?.id ?? "new"}`}>Type</Label>
          <Select
            id={`type-${field?.id ?? "new"}`}
            name="type"
            aria-describedby={`type-help-${fieldId}`}
            defaultValue={field?.type ?? FormFieldType.TEXT}
          >
            {Object.values(FormFieldType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </Select>
          <p
            className="text-muted-foreground text-xs"
            id={`type-help-${fieldId}`}
          >
            Define o tipo de input renderizado no formulario publico.
          </p>
        </Field>
      </Grid>
      <Grid className="min-w-0 sm:grid-cols-2 xl:grid-cols-3">
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-placeholder`}>Placeholder</Label>
          <Input
            id={`field-${fieldId}-placeholder`}
            name="placeholder"
            defaultValue={field?.placeholder ?? ""}
          />
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-help-text`}>Help text</Label>
          <Input
            id={`field-${fieldId}-help-text`}
            name="helpText"
            defaultValue={field?.helpText ?? ""}
          />
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-default-value`}>
            Default value
          </Label>
          <Input
            id={`field-${fieldId}-default-value`}
            name="defaultValue"
            defaultValue={field?.defaultValue ?? ""}
          />
        </Field>
      </Grid>
      <Grid className="min-w-0 sm:grid-cols-2 xl:grid-cols-3">
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-options`}>Options JSON</Label>
          <Textarea
            className="font-mono text-xs"
            id={`field-${fieldId}-options`}
            name="options"
            aria-describedby={`field-${fieldId}-options-help`}
            defaultValue={json(field?.options, [])}
          />
          <p
            className="text-muted-foreground text-xs"
            id={`field-${fieldId}-options-help`}
          >
            Para select/radio:{" "}
            <code className="break-all">
              {`[{"label":"Consulta","value":"consulta"}]`}
            </code>
          </p>
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-validation`}>Validation JSON</Label>
          <Textarea
            className="font-mono text-xs"
            id={`field-${fieldId}-validation`}
            name="validation"
            aria-describedby={`field-${fieldId}-validation-help`}
            defaultValue={json(field?.validation, {})}
          />
          <p
            className="text-muted-foreground text-xs"
            id={`field-${fieldId}-validation-help`}
          >
            Exemplo: <code>{`{"minLength":3,"maxLength":120}`}</code>
          </p>
        </Field>
        <Field className="min-w-0">
          <Label htmlFor={`field-${fieldId}-conditional-logic`}>
            Conditional Logic JSON
          </Label>
          <Textarea
            className="font-mono text-xs"
            id={`field-${fieldId}-conditional-logic`}
            name="conditionalLogic"
            aria-describedby={`field-${fieldId}-conditional-logic-help`}
            defaultValue={json(field?.conditionalLogic, [])}
          />
          <p
            className="text-muted-foreground text-xs"
            id={`field-${fieldId}-conditional-logic-help`}
          >
            Exemplo:{" "}
              <code className="break-all">
                {`[{"field":"service","operator":"equals","value":"orcamento","action":"show"}]`}
              </code>
          </p>
        </Field>
      </Grid>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            name="isRequired"
            defaultChecked={field?.isRequired ?? false}
          />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            name="isVisible"
            defaultChecked={field?.isVisible ?? true}
          />
          Visible
        </label>
      </div>
      <Button type="submit">{field ? "Save field" : "Add field"}</Button>
    </ActionFeedbackForm>
  );
}

function json(value: unknown, fallback: unknown) {
  return JSON.stringify(value ?? fallback, null, 2);
}
