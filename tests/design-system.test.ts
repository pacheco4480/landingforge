import { describe, expect, it } from "vitest";

import { designTokens } from "@/config/design-tokens";

describe("designTokens", () => {
  it("exposes required semantic color tokens", () => {
    expect(Object.keys(designTokens.colors).sort()).toEqual([
      "accent",
      "error",
      "info",
      "neutral",
      "primary",
      "secondary",
      "success",
      "warning",
    ]);
  });

  it("keeps the documented spacing scale stable", () => {
    expect(designTokens.spacing).toEqual([
      4, 8, 12, 16, 24, 32, 48, 64, 96, 128,
    ]);
  });

  it("includes the documented typography roles", () => {
    expect(Object.keys(designTokens.typography).sort()).toEqual([
      "body",
      "bodyLarge",
      "bodySmall",
      "caption",
      "display",
      "h1",
      "h2",
      "h3",
      "h4",
    ]);
  });
});
