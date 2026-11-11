import {
  formFieldSchema,
  type FormFieldInput,
} from "@/features/forms/schemas/form-field.schema";

const jsonFields = ["options", "validation", "conditionalLogic"] as const;

const fieldLabels: Record<string, string> = {
  options: "Opções (modo avançado)",
  validation: "Validação avançada",
  conditionalLogic: "Regras condicionais avançadas",
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

    return {
      success: false,
      message: validationMessage(field, issue?.path[1]),
    };
  }

  return { success: true, data: result.data };
}

function validationMessage(field: unknown, detail: unknown) {
  if (field === "label") return "Indica um rótulo com até 120 caracteres.";
  if (field === "name") return "Usa um identificador iniciado por letra, com letras minúsculas, números ou underscore.";
  if (field === "type") return "Seleciona um tipo de campo válido.";
  if (field === "options") return "Revê as opções: cada uma precisa de um texto e de um valor, com até 80 caracteres.";
  if (field === "validation") {
    if (detail === "minLength" || detail === "maxLength") return "Revê os comprimentos mínimo e máximo; o mínimo não pode exceder o máximo.";
    if (detail === "min" || detail === "max") return "Revê os valores mínimo e máximo; o mínimo não pode exceder o máximo.";
    if (detail === "regex") return "A expressão regular não é válida. Corrige-a ou remove-a.";
    return "Revê os limites e a expressão da validação avançada.";
  }
  if (field === "conditionalLogic") return "Revê as regras condicionais: confirma o campo, a condição e a ação.";
  if (field === "formId") return "Não foi possível identificar o formulário. Atualiza a página e tenta novamente.";
  return "Revê os dados do campo e corrige os valores assinalados.";
}

function readString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}
