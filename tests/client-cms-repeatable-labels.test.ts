import { describe, expect, it } from "vitest";

import {
  clientCmsStructuredSectionTypes,
  clientCmsSectionTypeLabel,
  repeatableCollectionLabel,
} from "@/features/exports/client-runtime/cms/components/section-content-editor";
import { getTemplateDefinition } from "@/features/public-renderer/template-registry";

describe("client CMS repeatable collection labels", () => {
  it("labels restaurant reviews as evaluations rather than testimonials", () => {
    expect(repeatableCollectionLabel("restaurant_reviews")).toBe("Avaliações");
  });

  it("keeps menu, FAQ, and testimonial labels contextual", () => {
    expect(repeatableCollectionLabel("restaurant_menu_highlights")).toBe("Itens do menu");
    expect(repeatableCollectionLabel("faq")).toBe("Perguntas frequentes");
    expect(repeatableCollectionLabel("beauty_testimonials")).toBe("Testemunhos");
  });

  it("shows localized section types without changing stored identifiers", () => {
    expect(clientCmsSectionTypeLabel("restaurant_menu_highlights")).toBe("Destaques do menu");
    expect(clientCmsSectionTypeLabel("clinic_services")).toBe("Secção personalizada");
  });

  it("provides structured client editing for the six observed Restaurant Playful sections", () => {
    expect(clientCmsStructuredSectionTypes()).toEqual(expect.arrayContaining([
      "restaurant_hero",
      "restaurant_signature_dishes",
      "restaurant_experience",
      "restaurant_gallery",
      "restaurant_reservation",
      "restaurant_location",
    ]));
    expect(repeatableCollectionLabel("restaurant_signature_dishes")).toBe("Pratos e experiências em destaque");
    expect(repeatableCollectionLabel("restaurant_reservation")).toBe("Informações da reserva");
  });

  it("has a localized display label for every currently supported template section", () => {
    const templateKeys = ["base", "universal", "real_estate", "clinic", "restaurant", "bakery", "gym"];
    const sectionTypes = new Set(
      templateKeys.flatMap((key) => getTemplateDefinition(key)?.supportedSections ?? []),
    );

    for (const sectionType of sectionTypes) {
      expect(clientCmsSectionTypeLabel(sectionType), sectionType).not.toBe("Secção personalizada");
    }
  });
});
