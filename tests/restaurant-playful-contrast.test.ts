import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { getContrastRatio } from "@/features/branding/services/contrast.service";

const stylesheet = readFileSync(
  "src/features/public-renderer/templates/restaurant/restaurant-playful.css",
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
  const value = declarationsFor(".restaurant-playful")[name];
  if (!value) throw new Error(`Missing theme color: ${name}`);
  return value;
}

describe("Restaurant Playful text contrast", () => {
  const ink = themeColor("--playful-ink");
  const orange = themeColor("--playful-orange");
  const paper = themeColor("--playful-paper");

  it("keeps the hero CTA readable against the orange background", () => {
    expect(declarationsFor(".restaurant-playful-button").color).toBe(
      "var(--playful-ink)",
    );
    expect(getContrastRatio(ink, orange)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the menu index and signature-dishes kicker at WCAG AA contrast", () => {
    expect(declarationsFor(".restaurant-playful-menu__index").color).toBe(
      "var(--playful-ink)",
    );
    expect(
      declarationsFor(".restaurant-playful-dishes .restaurant-playful-kicker")
        .color,
    ).toBe("var(--playful-ink)");
    expect(getContrastRatio(ink, paper)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(ink, orange)).toBeGreaterThanOrEqual(4.5);
  });
});
