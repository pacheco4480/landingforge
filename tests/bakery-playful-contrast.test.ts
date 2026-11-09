import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { getContrastRatio } from "@/features/branding/services/contrast.service";

const stylesheet = readFileSync(
  "src/features/public-renderer/templates/bakery/bakery-playful.css",
  "utf8",
);
const root = postcss.parse(stylesheet);

function declarationsFor(selector: string) {
  let declarations: Record<string, string> | undefined;

  root.walkRules((rule) => {
    if (!rule.selectors?.includes(selector)) return;
    declarations = Object.fromEntries(
      (rule.nodes ?? [])
        .filter((node): node is postcss.Declaration => node.type === "decl")
        .map(({ prop, value }) => [prop, value]),
    );
  });

  if (!declarations) throw new Error(`Missing CSS rule: ${selector}`);
  return declarations;
}

function themeColor(name: string) {
  const value = declarationsFor(".bakery-playful")[name];
  if (!value) throw new Error(`Missing theme color: ${name}`);
  return value;
}

describe("Bakery Playful featured CTA contrast", () => {
  const ink = themeColor("--bakery-ink");
  const plum = themeColor("--bakery-plum");
  const white = "#ffffff";

  it("keeps text contrast above WCAG AA in normal and hover states", () => {
    expect(
      declarationsFor(".bakery-playful-featured__copy > a").color,
    ).toBe("var(--bakery-ink)");
    expect(
      declarationsFor(".bakery-playful-featured__copy > a:hover").color,
    ).toBe("var(--bakery-plum)");
    expect(getContrastRatio(ink, white)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(plum, white)).toBeGreaterThanOrEqual(4.5);
  });

  it("uses a clearly visible focus indicator against the featured surface", () => {
    expect(
      declarationsFor(".bakery-playful-featured__copy > a:focus-visible")[
        "outline-color"
      ],
    ).toBe("var(--bakery-ink)");
    expect(getContrastRatio(ink, white)).toBeGreaterThanOrEqual(3);
  });
});
