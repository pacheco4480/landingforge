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
  it("associates every advanced control with a unique visible label", () => {
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
    const advancedNames = [
      "Placeholder",
      "Help text",
      "Default value",
      "Options JSON",
      "Validation JSON",
      "Conditional Logic JSON",
    ];

    expect(new Set(ids).size).toBe(ids.length);
    for (const [, id] of labels) {
      expect(controlIds.has(id), `label target ${id}`).toBe(true);
    }
    for (const name of advancedNames) {
      const matchingLabels = labels.filter((match) => match[2].includes(name));
      expect(matchingLabels).toHaveLength(2);
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
      "type-help-field-one",
      "field-field-one-options-help",
      "field-field-one-validation-help",
      "field-field-one-conditional-logic-help",
    ];

    for (const helpId of helpIds) {
      expect(markup).toContain(`aria-describedby="${helpId}"`);
      expect(markup).toContain(`id="${helpId}"`);
    }
  });
});
