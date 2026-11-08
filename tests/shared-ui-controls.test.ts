import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { LoadingSpinner, Skeleton } from "@/components/ui/feedback";

describe("shared UI control contracts", () => {
  it("keeps invalid state authoritative when the error prop is set", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Input, { error: true, "aria-invalid": false }),
        createElement(Textarea, { error: true, "aria-invalid": false }),
      ),
    );

    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(2);
  });

  it("preserves native button and select semantics", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Button, { type: "button" }, "Continuar"),
        createElement(Select, { "aria-label": "Estado" },
          createElement("option", { value: "draft" }, "Rascunho"),
        ),
      ),
    );

    expect(markup).toMatch(/<button\b[^>]*type="button"/);
    expect(markup).toMatch(/<select\b[^>]*aria-label="Estado"/);
    expect(markup).toContain('<option value="draft">Rascunho</option>');
  });

  it("marks shared loading animations for reduced-motion users", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Button, { isLoading: true }, "A guardar"),
        createElement(LoadingSpinner),
        createElement(Skeleton),
      ),
    );

    expect(markup.match(/motion-reduce:animate-none/g)).toHaveLength(3);
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain("A guardar");
  });

  it("keeps toast loading motion reduced without expanding the component API", () => {
    const source = readFileSync(
      resolve("src/components/ui/action-feedback.tsx"),
      "utf8",
    );

    expect(source).toContain('"animate-spin motion-reduce:animate-none"');
  });
});
