import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CmsProductBrand } from "@/features/cms/components/cms-product-brand";

describe("Master CMS product identity", () => {
  it("uses the same accessible wordmark in full and compact shell placements", () => {
    const full = renderToStaticMarkup(createElement(CmsProductBrand));
    const compact = renderToStaticMarkup(
      createElement(CmsProductBrand, { compact: true }),
    );

    for (const markup of [full, compact]) {
      expect(markup).toContain("LandingForge");
    }

    expect(full).toContain('aria-hidden="true"');
    expect(full).toContain("bg-primary");
    expect(compact).not.toContain("bg-primary");
    expect(full).toContain("Operações da plataforma");
    expect(compact).not.toContain("Operações da plataforma");
  });
});
