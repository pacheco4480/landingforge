import { FormFieldType, type FormField } from "@/generated/prisma/client";
import { evaluateConditionalRule } from "@/features/forms/services/conditional-logic.service";
import type { ConditionalLogicRule } from "@/features/forms/schemas/conditional-logic.schema";

type ValidationConfig = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  regex?: string;
  message?: string;
};

export type FieldValidationResult = {
  name: string;
  message: string;
};

export function validateSubmissionFields(
  fields: FormField[],
  values: Record<string, unknown>,
) {
  const errors: FieldValidationResult[] = [];

  for (const field of fields.filter((item) => isFieldActive(item, values))) {
    const value = values[field.name];
    const text = value == null ? "" : String(value).trim();
    const validation = parseValidation(field.validation);
    const required = isFieldRequired(field, values);

    if (required && !text && field.type !== FormFieldType.FILE) {
      errors.push({ name: field.name, message: `${field.label} é obrigatório.` });
      continue;
    }
    if (!text) continue;

    if (
      field.type === FormFieldType.EMAIL &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
    ) {
      errors.push({ name: field.name, message: "Usa um email válido." });
    }
    if (
      field.type === FormFieldType.PHONE &&
      !/^[+()\d\s.-]{7,30}$/.test(text)
    ) {
      errors.push({ name: field.name, message: "Usa um telefone válido." });
    }
    if (field.type === FormFieldType.NUMBER) {
      const number = Number(text);
      if (Number.isNaN(number)) {
        errors.push({ name: field.name, message: "Usa um número válido." });
      }
      if (validation.min !== undefined && number < validation.min) {
        errors.push({
          name: field.name,
          message: `O valor mínimo é ${validation.min}.`,
        });
      }
      if (validation.max !== undefined && number > validation.max) {
        errors.push({
          name: field.name,
          message: `O valor máximo é ${validation.max}.`,
        });
      }
    }
    if (
      validation.minLength !== undefined &&
      text.length < validation.minLength
    ) {
      errors.push({
        name: field.name,
        message: `Mínimo de ${validation.minLength} caracteres.`,
      });
    }
    if (
      validation.maxLength !== undefined &&
      text.length > validation.maxLength
    ) {
      errors.push({
        name: field.name,
        message: `Máximo de ${validation.maxLength} caracteres.`,
      });
    }
    if (validation.regex && !new RegExp(validation.regex).test(text)) {
      errors.push({
        name: field.name,
        message: validation.message || "Valor inválido.",
      });
    }
  }

  return errors;
}

function isFieldActive(field: FormField, values: Record<string, unknown>) {
  if (!field.isVisible) return false;
  const rules = parseConditionalRules(field.conditionalLogic);
  const visibilityRules = rules.filter(
    (rule) => rule.action === "show" || rule.action === "hide",
  );
  if (visibilityRules.length === 0) return true;

  return visibilityRules.every((rule) => {
    const matches = evaluateConditionalRule(rule, values);
    return rule.action === "hide" ? !matches : matches;
  });
}

function isFieldRequired(field: FormField, values: Record<string, unknown>) {
  const rules = parseConditionalRules(field.conditionalLogic);
  return (
    field.isRequired ||
    rules.some(
      (rule) => rule.action === "require" && evaluateConditionalRule(rule, values),
    )
  );
}

function parseConditionalRules(value: unknown): ConditionalLogicRule[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (rule): rule is ConditionalLogicRule =>
      Boolean(rule) &&
      typeof rule === "object" &&
      typeof (rule as { field?: unknown }).field === "string" &&
      typeof (rule as { operator?: unknown }).operator === "string" &&
      typeof (rule as { action?: unknown }).action === "string",
  );
}

function parseValidation(value: unknown): ValidationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ValidationConfig;
}
