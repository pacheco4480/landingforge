import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import postcss from "postcss";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicBaseStyles } from "@/features/public-renderer/components/public-base-styles";

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

describe("shared public reduced-motion policy", () => {
  it("globally disables motion and hover zoom for marked images in public and exported renderers", () => {
    const markup = renderToStaticMarkup(createElement(PublicBaseStyles));

    expect(markup).toContain("prefers-reduced-motion: reduce");
    expect(markup).toContain("animation: none !important");
    expect(markup).toContain("transition: none !important");
    expect(markup).toContain("scroll-behavior: auto !important");
    expect(markup).toContain(
      ':root img[data-public-motion="hover-zoom"]',
    );
    expect(markup).toContain("transform: none !important");
  });

  it("requires template hover zoom rules to opt into the shared reduced-motion marker", () => {
    const templateRoot = resolve("src/features/public-renderer/templates");
    const stylesheets = filesUnder(templateRoot).filter(
      (path) => extname(path) === ".css",
    );
    let checkedRules = 0;

    for (const stylesheet of stylesheets) {
      const root = postcss.parse(readFileSync(stylesheet, "utf8"), {
        from: stylesheet,
      });
      const zoomRules: string[] = [];

      root.walkRules((rule) => {
        if (!rule.selector.includes(":hover")) return;
        const scalesAnElement = rule.nodes?.some(
          (node) =>
            node.type === "decl" &&
            node.prop === "transform" &&
            /scale\(/i.test(node.value),
        );
        if (scalesAnElement) zoomRules.push(rule.selector);
      });

      if (zoomRules.length === 0) continue;
      checkedRules += zoomRules.length;

      for (const selector of zoomRules) {
        expect(
          selector,
          `${basename(stylesheet)} has an unmarked hover zoom selector`,
        ).toContain('[data-public-motion="hover-zoom"]');
      }

      const stem = basename(stylesheet).replace(/\.module\.css$|\.css$/, "");
      const component = join(dirname(stylesheet), `${stem}.tsx`);
      expect(existsSync(component), `${stem} must expose its hover motion marker`).toBe(
        true,
      );
      const source = readFileSync(component, "utf8");
      expect(source).toContain("data-public-motion");
      expect(source).toContain('"hover-zoom"');
    }

    expect(checkedRules).toBeGreaterThan(0);
  });
});
