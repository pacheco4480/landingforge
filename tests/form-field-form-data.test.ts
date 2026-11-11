import { describe, expect, it } from "vitest";

import { parseFormFieldFormData } from "@/features/forms/validation/form-field-form-data";

function makeFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    formId: "550e8400-e29b-41d4-a716-446655440000",
    label: "Pedido",
    name: "request",
    type: "TEXT",
    options: "[]",
    validation: "{}",
    conditionalLogic: "[]",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("parseFormFieldFormData", () => {
  it.each([
    ["options", "Opções (modo avançado)"],
    ["validation", "Validação avançada"],
    ["conditionalLogic", "Regras condicionais avançadas"],
  ])("returns a field-specific error for malformed %s JSON", (key, label) => {
    const result = parseFormFieldFormData(makeFormData({ [key]: "[" }));

    expect(result).toEqual({
      success: false,
      message: `${label}: introduza JSON válido.`,
    });
  });

  it("returns a validation error when JSON has the wrong shape", () => {
    const result = parseFormFieldFormData(
      makeFormData({ options: "{}" }),
    );

    expect(result).toEqual({
      success: false,
      message:
        "Revê as opções: cada uma precisa de um texto e de um valor, com até 80 caracteres.",
    });
  });

  it("returns parsed field data for a valid payload", () => {
    const result = parseFormFieldFormData(
      makeFormData({
        options: '[{"label":"Consulta","value":"consulta"}]',
        validation: '{"minLength":3}',
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options).toEqual([
        { label: "Consulta", value: "consulta" },
      ]);
      expect(result.data.validation.minLength).toBe(3);
    }
  });

  it("returns an actionable Portuguese validation message", () => {
    const result = parseFormFieldFormData(
      makeFormData({ validation: '{"minLength":12,"maxLength":4}' }),
    );

    expect(result).toEqual({
      success: false,
      message:
        "Revê os comprimentos mínimo e máximo; o mínimo não pode exceder o máximo.",
    });
  });

  it("parses common conditional rules using the existing contract", () => {
    const result = parseFormFieldFormData(
      makeFormData({
        conditionalLogic:
          '[{"field":"service","operator":"equals","value":"consultation","action":"show"}]',
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conditionalLogic).toEqual([
        {
          field: "service",
          operator: "equals",
          value: "consultation",
          action: "show",
        },
      ]);
    }
  });
});
