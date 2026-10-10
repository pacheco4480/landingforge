import {
  FormFieldType,
  type Form,
  type FormField,
} from "@/generated/prisma/client";
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
} from "@/components/ui/layout";

export function FormPreview({
  form,
  fields,
}: {
  form: Form;
  fields: FormField[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          {form.description || "Responsive form preview."}
        </CardDescription>
      </CardHeader>
      <form className="grid gap-4">
        {fields
          .filter((field) => field.isVisible)
          .map((field) => (
            <PreviewField field={field} key={field.id} />
          ))}
        <Button type="button">Submit</Button>
      </form>
    </Card>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const options = Array.isArray(field.options)
    ? field.options.filter(isOption)
    : [];
  return (
    <Field>
      {field.type !== FormFieldType.HIDDEN ? (
        <Label htmlFor={`preview-${field.id}`}>
          {field.label}
          {field.isRequired ? " *" : ""}
        </Label>
      ) : null}
      {field.type === FormFieldType.TEXTAREA ? (
        <Textarea
          id={`preview-${field.id}`}
          placeholder={field.placeholder ?? undefined}
          defaultValue={field.defaultValue ?? ""}
        />
      ) : field.type === FormFieldType.SELECT ||
        field.type === FormFieldType.MULTI_SELECT ? (
        <Select
          id={`preview-${field.id}`}
          multiple={field.type === FormFieldType.MULTI_SELECT}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {String(option.label)}
            </option>
          ))}
        </Select>
      ) : field.type === FormFieldType.CHECKBOX ? (
        <Checkbox id={`preview-${field.id}`} />
      ) : (
        <Input
          id={`preview-${field.id}`}
          type={inputType(field.type)}
          placeholder={field.placeholder ?? undefined}
          defaultValue={field.defaultValue ?? ""}
        />
      )}
      {field.helpText ? (
        <p className="text-muted-foreground text-sm">{field.helpText}</p>
      ) : null}
    </Field>
  );
}

function isOption(value: unknown): value is { label: string; value: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "label" in value &&
    "value" in value &&
    typeof value.label === "string" &&
    typeof value.value === "string"
  );
}

function inputType(type: FormFieldType) {
  if (type === FormFieldType.EMAIL) return "email";
  if (type === FormFieldType.NUMBER) return "number";
  if (type === FormFieldType.DATE) return "date";
  if (type === FormFieldType.FILE) return "file";
  if (type === FormFieldType.HIDDEN) return "hidden";
  return "text";
}
