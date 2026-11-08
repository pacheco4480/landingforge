import { describe, expect, it } from "vitest";

import { repeatableCollectionLabel } from "@/features/exports/client-runtime/cms/components/section-content-editor";

describe("client CMS repeatable collection labels", () => {
  it("labels restaurant reviews as evaluations rather than testimonials", () => {
    expect(repeatableCollectionLabel("restaurant_reviews")).toBe("Avaliações");
  });

  it("keeps menu, FAQ, and testimonial labels contextual", () => {
    expect(repeatableCollectionLabel("restaurant_menu_highlights")).toBe("Itens do menu");
    expect(repeatableCollectionLabel("faq")).toBe("Perguntas frequentes");
    expect(repeatableCollectionLabel("beauty_testimonials")).toBe("Testemunhos");
  });
});
