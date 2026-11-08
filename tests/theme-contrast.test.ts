import { describe, expect, it } from "vitest";

import {
  getAccessibleTextColor,
  getContrastRatio,
  meetsWcagAa,
} from "@/features/branding/services/contrast.service";

describe("theme contrast", () => {
  it("detects WCAG AA passing contrast", () => {
    expect(meetsWcagAa("#111827", "#ffffff")).toBe(true);
    expect(getContrastRatio("#111827", "#ffffff")).toBeGreaterThan(4.5);
  });

  it("detects insufficient contrast", () => {
    expect(meetsWcagAa("#cccccc", "#ffffff")).toBe(false);
  });

  it("chooses an AA-readable foreground for light and dark brand colors", () => {
    for (const background of [
      "#ff6b35",
      "#e85d2c",
      "#777777",
      "#14532d",
      "#111827",
    ]) {
      const foreground = getAccessibleTextColor(background);
      expect(meetsWcagAa(foreground, background)).toBe(true);
      expect(foreground).toBe(
        getContrastRatio("#000000", background) >=
          getContrastRatio("#ffffff", background)
          ? "#000000"
          : "#ffffff",
      );
    }
  });
});
