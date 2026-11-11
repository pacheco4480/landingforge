import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { FormField } from "@/generated/prisma/client";

vi.mock("@/components/ui/action-feedback", () => ({
  ActionFeedbackForm: ({ children }: { children: ReactNode }) =>
    createElement("form", null, children),
}));

vi.mock("@/features/forms/actions/form-field.actions", () => ({
  saveFormFieldAction: async () => undefined,
}));

import { FieldForm } from "@/features/forms/components/field-editor";

const formId = "550e8400-e29b-41d4-a716-446655440000";

function makeField(id: string, name: string): FormField {
  return {
    id,
    formId,
    label: name,
    name,
    type: "TEXT",
    placeholder: null,
    helpText: null,
    defaultValue: null,
    options: [],
    validation: {},
    conditionalLogic: [],
    isRequired: false,
    isVisible: true,
    sortOrder: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
  } as FormField;
}

describe("forms field editor accessibility", () => {
  it("associates form controls with unique visible labels", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(FieldForm, {
          field: makeField("field-one", "Email"),
          formId,
        }),
        createElement(FieldForm, {
          field: makeField("field-two", "Phone"),
          formId,
        }),
      ),
    );
    const labels = [
      ...markup.matchAll(/<label[^>]*\bfor="([^"]+)"[^>]*>(.*?)<\/label>/g),
    ];
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const controlIds = new Set(
      [
        ...markup.matchAll(/<(?:input|textarea|select)\b[^>]*\bid="([^"]+)"/g),
      ].map((match) => match[1]),
    );
    const labelsById = new Map(labels.map((match) => [match[1], match[2]]));
    const commonNames = [
      "Texto de exemplo",
      "Texto de ajuda",
      "Valor predefinido",
      "Tipo de campo",
    ];

    expect(new Set(ids).size).toBe(ids.length);
    for (const [, id] of labels) {
      expect(controlIds.has(id), `label target ${id}`).toBe(true);
    }
    for (const name of commonNames) {
      const matchingLabels = labels.filter((match) => match[2].includes(name));
      if (name === "Tipo de campo") {
        expect(matchingLabels).toHaveLength(2);
      } else {
        expect(matchingLabels.length).toBeGreaterThan(0);
      }
      for (const [, id] of matchingLabels) {
        expect(ids).toContain(id);
        expect(labelsById.get(id)).toContain(name);
      }
    }
  });

  it("associates help text with every control that provides it", () => {
    const markup = renderToStaticMarkup(
      createElement(FieldForm, {
        field: makeField("field-one", "Email"),
        formId,
      }),
    );
    const helpIds = [
      "label-help-field-one",
      "name-help-field-one",
    ];

    for (const helpId of helpIds) {
      expect(markup).toContain(`aria-describedby="${helpId}"`);
      expect(markup).toContain(`id="${helpId}"`);
    }
    const ids = new Set(
      [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
    );
    const describedBy = [...markup.matchAll(/aria-describedby="([^"]+)"/g)];
    for (const [, value] of describedBy) {
      for (const id of value.split(" ")) expect(ids).toContain(id);
    }
  });

  it("renders visual option and validation controls without exposing JSON fields", () => {
    const markup = renderToStaticMarkup(
      createElement(FieldForm, {
        field: {
          ...makeField("field-select", "Serviço"),
          type: "SELECT",
          options: [{ label: "Consulta", value: "consulta" }],
          validation: { minLength: 3, maxLength: 80 },
          conditionalLogic: [
            {
              field: "service",
              operator: "equals",
              value: "consulta",
              action: "disable",
            },
          ],
        } as FormField,
        formId,
        fields: [{ name: "service", label: "Serviço" }],
      }),
    );

    expect(markup).toContain("Texto da opção 1");
    expect(markup).toContain("Valor guardado");
    expect(markup).toContain('name="options"');
    expect(markup).toContain('name="validation"');
    expect(markup).toContain('name="conditionalLogic"');
    expect(markup).toContain("Campo de referência");
    expect(markup).toContain("Ação existente não aplicada: disable");
    expect(markup).not.toContain("Options JSON");
    expect(markup).not.toContain("Validation JSON");
    expect(markup).not.toContain("Conditional Logic JSON");

    const textMarkup = renderToStaticMarkup(
      createElement(FieldForm, {
        field: {
          ...makeField("field-text", "Mensagem"),
          validation: { minLength: 3, maxLength: 80 },
        } as FormField,
        formId,
      }),
    );
    expect(textMarkup).toContain("Comprimento mínimo");
    expect(textMarkup).toContain("Comprimento máximo");
  });
});
