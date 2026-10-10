import { describe, expect, it } from "vitest";

import { FormFieldType } from "@/generated/prisma/client";
import { validateSubmissionFields } from "@/features/forms/services/form-validation.service";

describe("form validation", () => {
  it("validates required email fields", () => {
    const errors = validateSubmissionFields(
      [
        {
          id: "field",
          formId: "form",
          label: "Email",
          name: "email",
          type: FormFieldType.EMAIL,
          placeholder: null,
          helpText: null,
          defaultValue: null,
          options: null,
          validation: null,
          conditionalLogic: null,
          sortOrder: 0,
          isRequired: true,
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { email: "invalid" },
    );

    expect(errors[0]?.name).toBe("email");
  });

  it("returns a field-level required error", () => {
    const errors = validateSubmissionFields(
      [
        {
          id: "field",
          formId: "form",
          label: "Nome",
          name: "name",
          type: FormFieldType.TEXT,
          placeholder: null,
          helpText: null,
          defaultValue: null,
          options: null,
          validation: null,
          conditionalLogic: null,
          sortOrder: 0,
          isRequired: true,
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { name: "" },
    );

    expect(errors).toEqual([{ name: "name", message: "Nome é obrigatório." }]);
  });

  it("does not validate required fields hidden by conditional logic", () => {
    const errors = validateSubmissionFields(
      [
        {
          id: "field",
          formId: "form",
          label: "Orcamento",
          name: "budget",
          type: FormFieldType.TEXT,
          placeholder: null,
          helpText: null,
          defaultValue: null,
          options: null,
          validation: null,
          conditionalLogic: [
            {
              field: "service",
              operator: "equals",
              value: "orcamento",
              action: "show",
            },
          ],
          sortOrder: 0,
          isRequired: true,
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { service: "consulta" },
    );

    expect(errors).toEqual([]);
  });
});
