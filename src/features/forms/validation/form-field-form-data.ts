import {
  formFieldSchema,
  type FormFieldInput,
} from "@/features/forms/schemas/form-field.schema";

const jsonFields = ["options", "validation", "conditionalLogic"] as const;

const fieldLabels: Record<string, string> = {
  options: "Options JSON",
  validation: "Validation JSON",
  conditionalLogic: "Conditional Logic JSON",
};

type FormFieldFormDataResult =
  | { success: true; data: FormFieldInput }
  | { success: false; message: string };

export function parseFormFieldFormData(
  formData: FormData,
): FormFieldFormDataResult {
  const parsedJson: Record<string, unknown> = {};

  for (const key of jsonFields) {
    const raw = formData.get(key);
    const fallback = key === "validation" ? "{}" : "[]";

    try {
      parsedJson[key] = JSON.parse(
        typeof raw === "string" && raw.trim() ? raw : fallback,
      ) as unknown;
    } catch {
      return {
        success: false,
        message: `${fieldLabels[key]}: introduza JSON válido.`,
      };
    }
  }

  const result = formFieldSchema.safeParse({
    id: readString(formData, "id") || undefined,
    formId: readString(formData, "formId"),
    label: readString(formData, "label"),
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    placeholder: readString(formData, "placeholder"),
    helpText: readString(formData, "helpText"),
    defaultValue: readString(formData, "defaultValue"),
    ...parsedJson,
    isRequired: formData.get("isRequired") === "on",
    isVisible: formData.get("isVisible") === "on",
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path[0];
    const label = typeof field === "string" ? fieldLabels[field] ?? field : "dados";

    return {
      success: false,
      message: `Verifica o campo ${label}.`,
    };
  }

  return { success: true, data: result.data };
}

function readString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}
