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
  return (
    <ActionFeedbackForm
      action={saveFormFieldAction}
      className="grid gap-4"
      loadingMessage="A guardar campo..."
      successMessage="Campo guardado."
    >
      <input name="formId" type="hidden" value={formId} />
      {field ? <input name="id" type="hidden" value={field.id} /> : null}
      <Grid className="md:grid-cols-3">
        <Field>
          <Label htmlFor={`label-${field?.id ?? "new"}`}>Label</Label>
          <Input
            id={`label-${field?.id ?? "new"}`}
            name="label"
            defaultValue={field?.label ?? ""}
            required
          />
          <p className="text-muted-foreground text-xs">
            Texto visivel para o visitante, por exemplo <code>Email</code>.
          </p>
        </Field>
        <Field>
          <Label htmlFor={`name-${field?.id ?? "new"}`}>Name</Label>
          <Input
            id={`name-${field?.id ?? "new"}`}
            name="name"
            defaultValue={field?.name ?? ""}
            required
          />
          <p className="text-muted-foreground text-xs">
            Chave interna sem espacos, por exemplo email, phone ou message.
          </p>
        </Field>
        <Field>
          <Label htmlFor={`type-${field?.id ?? "new"}`}>Type</Label>
          <Select
            id={`type-${field?.id ?? "new"}`}
            name="type"
            defaultValue={field?.type ?? FormFieldType.TEXT}
          >
            {Object.values(FormFieldType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </Select>
          <p className="text-muted-foreground text-xs">
            Define o tipo de input renderizado no formulario publico.
          </p>
        </Field>
      </Grid>
      <Grid className="md:grid-cols-3">
        <Field>
          <Label>Placeholder</Label>
          <Input name="placeholder" defaultValue={field?.placeholder ?? ""} />
        </Field>
        <Field>
          <Label>Help text</Label>
          <Input name="helpText" defaultValue={field?.helpText ?? ""} />
        </Field>
        <Field>
          <Label>Default value</Label>
          <Input name="defaultValue" defaultValue={field?.defaultValue ?? ""} />
        </Field>
      </Grid>
      <Grid className="md:grid-cols-3">
        <Field>
          <Label>Options JSON</Label>
          <Textarea
            className="font-mono text-xs"
            name="options"
            defaultValue={json(field?.options, [])}
          />
          <p className="text-muted-foreground text-xs">
            Para select/radio: <code>{`[{"label":"Consulta","value":"consulta"}]`}</code>
          </p>
        </Field>
        <Field>
          <Label>Validation JSON</Label>
          <Textarea
            className="font-mono text-xs"
            name="validation"
            defaultValue={json(field?.validation, {})}
          />
          <p className="text-muted-foreground text-xs">
            Exemplo: <code>{`{"minLength":3,"maxLength":120}`}</code>
          </p>
        </Field>
        <Field>
          <Label>Conditional Logic JSON</Label>
          <Textarea
            className="font-mono text-xs"
            name="conditionalLogic"
            defaultValue={json(field?.conditionalLogic, [])}
          />
          <p className="text-muted-foreground text-xs">
            Exemplo: <code>{`[{"field":"service","operator":"equals","value":"orcamento","action":"show"}]`}</code>
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
