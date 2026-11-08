import { describe, expect, it } from "vitest";

import { validateRepeatableSectionContent } from "@/features/content/repeatable-section-validation";
import { isSectionTypeSupported } from "@/features/public-renderer/template-registry";

describe("repeatable CMS section limits", () => {
  it("accepts editable FAQ items and permits an empty list", () => {
    expect(() => validateRepeatableSectionContent("bakery_faq", {
      items: [{ question: "Fazem encomendas?", answer: "Sim, mediante confirmação." }],
    })).not.toThrow();
    expect(() => validateRepeatableSectionContent("faq", { items: [] })).not.toThrow();
  });

  it("rejects empty required fields and values longer than their UI limits", () => {
    expect(() => validateRepeatableSectionContent("restaurant_menu_highlights", {
      items: [{ category: "", title: "Prato", description: "Descrição" }],
    })).toThrow(/Preenche category/);
    expect(() => validateRepeatableSectionContent("restaurant_reviews", {
      items: [{ name: "A", quote: "x".repeat(701) }],
    })).toThrow(/excede 700 caracteres/);
  });

  it("allows the supported review count and rejects items above the editor limit", () => {
    const items = Array.from({ length: 30 }, (_, index) => ({ name: `Pessoa ${index}`, quote: "Boa experiência." }));
    expect(() => validateRepeatableSectionContent("restaurant_reviews", { items })).not.toThrow();
    expect(() => validateRepeatableSectionContent("restaurant_reviews", {
      items: [...items, { name: "Pessoa 30", quote: "Boa experiência." }],
    })).toThrow(/até 30 itens/);
  });
});

describe("template section type support", () => {
  it("allows custom sections only for templates that register them", () => {
    expect(isSectionTypeSupported("restaurant", "restaurant_reviews")).toBe(true);
    expect(isSectionTypeSupported("restaurant", "restaurant_menu_highlights")).toBe(true);
    expect(isSectionTypeSupported("universal", "restaurant_reviews")).toBe(false);
    expect(isSectionTypeSupported(null, "hero")).toBe(true);
  });
});
