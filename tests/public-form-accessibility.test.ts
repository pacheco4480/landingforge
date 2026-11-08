import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicForm } from "@/features/public-renderer/components/forms/public-form";

describe("shared public form accessibility", () => {
  it("uses native required semantics and hides the visual marker from assistive technology", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicForm, {
        submitAction: async () => ({
          ok: false,
          fieldErrors: {},
          formError: null,
        }),
        formId: "contact",
        fields: [
          {
            id: "name",
            label: "Nome",
            name: "name",
            type: "TEXT",
            placeholder: null,
            helpText: null,
            defaultValue: null,
            options: null,
            conditionalLogic: null,
            isRequired: true,
            isVisible: true,
          },
        ],
        gdprConsentLabel: "Li e aceito a Política de Privacidade.",
        gdprConsentRequired: false,
        gdprConsentVersion: "test",
      }),
    );

    expect(markup).toContain('name="name"');
    expect(markup).toContain('method="post"');
    expect(markup).toContain('required=""');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('aria-label="obrigatório"');
  });

  it("keeps empty success and error live regions mounted without dangling ID references", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicForm, {
        submitAction: async () => ({
          ok: false,
          fieldErrors: {},
          formError: null,
        }),
        formId: "contact",
        fields: [],
        gdprConsentLabel: "Li e aceito a Política de Privacidade.",
        gdprConsentRequired: false,
        gdprConsentVersion: "test",
      }),
    );

    expect(markup).toMatch(/id="[^"]+-public-form-status"/);
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toMatch(/id="[^"]+-public-form-error"/);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).not.toContain('aria-describedby="public-form-status"');
  });

  it("keeps field and live-region IDs unique when the same form is reused", () => {
    const createTestForm = () =>
      createElement(PublicForm, {
        submitAction: async () => ({
          ok: false,
          fieldErrors: {},
          formError: null,
        }),
        formId: "contact",
        fields: [
          {
            id: "name",
            label: "Nome",
            name: "name",
            type: "TEXT",
            placeholder: null,
            helpText: "Indica o teu nome.",
            defaultValue: null,
            options: null,
            conditionalLogic: null,
            isRequired: true,
            isVisible: true,
          },
        ],
        gdprConsentLabel: "Li e aceito a Política de Privacidade.",
        gdprConsentRequired: false,
        gdprConsentVersion: "test",
      });
    const markup = renderToStaticMarkup(
      createElement(Fragment, null, createTestForm(), createTestForm()),
    );
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
