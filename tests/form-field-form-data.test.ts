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
    ["options", "Options JSON"],
    ["validation", "Validation JSON"],
    ["conditionalLogic", "Conditional Logic JSON"],
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
      message: "Verifica o campo Options JSON.",
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
});
