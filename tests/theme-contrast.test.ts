import { describe, expect, it } from "vitest";

import {
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
});
