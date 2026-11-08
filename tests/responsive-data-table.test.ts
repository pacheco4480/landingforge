import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DataTable } from "@/components/ui/data-display";

describe("responsive data table scroll region", () => {
  it("exposes an announced, keyboard-focusable scroll area when opted in", () => {
    const markup = renderToStaticMarkup(
      createElement(DataTable, {
        caption: "Registos de teste",
        columns: ["Data", "Ação"],
        rows: [["Hoje", "Abrir"]],
        scrollHint: "Use as setas do teclado ou deslize horizontalmente.",
        scrollRegionLabel: "Tabela de teste, deslocável horizontalmente",
      }),
    );

    expect(markup).toContain('role="region"');
    expect(markup).toContain(
      'aria-label="Tabela de teste, deslocável horizontalmente"',
    );
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("aria-describedby=");
    expect(markup).toContain("Use as setas do teclado ou deslize horizontalmente.");
    expect(markup).toContain(
      '<caption class="sr-only">Registos de teste</caption>',
    );
    expect(markup).toContain('scope="col"');
  });

  it("leaves other DataTable consumers unchanged by default", () => {
    const markup = renderToStaticMarkup(
      createElement(DataTable, {
        columns: ["Name"],
        rows: [["Example"]],
      }),
    );

    expect(markup).toContain('aria-label="Data table"');
    expect(markup).not.toContain('role="region"');
    expect(markup).not.toContain('tabindex="0"');
    expect(markup).not.toContain("Deslize horizontalmente");
  });
});
