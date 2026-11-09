import { describe, expect, it } from "vitest";

import {
  createDefaultSectionContent,
  sectionTypeLabel,
  sectionTypes,
} from "@/features/content/section-types";
import { getTemplateDefinition } from "@/features/public-renderer/template-registry";

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

  it("provides localized labels while keeping persisted section keys unchanged", () => {
    expect(sectionTypeLabel("restaurant_menu_highlights")).toBe("Destaques do menu");
    expect(sectionTypeLabel("unknown_internal_type")).toBe("Secção personalizada");
  });

  it("has a localized display label for every currently supported template section", () => {
    const templateKeys = ["base", "universal", "real_estate", "clinic", "restaurant", "bakery", "gym"];
    const supportedTypes = new Set(
      templateKeys.flatMap((key) => getTemplateDefinition(key)?.supportedSections ?? []),
    );

    for (const type of supportedTypes) {
      expect(sectionTypeLabel(type), type).not.toBe("Secção personalizada");
    }
  });
});
