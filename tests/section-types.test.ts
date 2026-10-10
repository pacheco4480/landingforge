import { describe, expect, it } from "vitest";

import {
  createDefaultSectionContent,
  sectionTypes,
} from "@/features/content/section-types";

describe("section types", () => {
  it("includes the required TASK 006 section types", () => {
    expect(sectionTypes).toEqual([
      "hero",
      "features",
      "services",
      "process",
      "testimonials",
      "faq",
      "gallery",
      "video",
      "team",
      "stats",
      "pricing",
      "contact",
      "map",
      "cta",
    ]);
  });

  it("creates CTA content with a required primary CTA", () => {
    const content = createDefaultSectionContent("cta");

    expect(content).toHaveProperty("ctaPrimary");
  });
});
