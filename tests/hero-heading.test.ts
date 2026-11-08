import { describe, expect, it } from "vitest";

import { isPrimaryHeroSection } from "@/features/public-renderer/hero-heading";
import type {
  PublicPageSection,
  PublicRendererContext,
} from "@/features/public-renderer/types";

function section(id: string, sectionType: string): PublicPageSection {
  return {
    id,
    sectionKey: id,
    sectionType,
    name: id,
    sortOrder: 0,
    isVisible: true,
    content: {},
    settings: {},
  };
}

function context(sections: PublicPageSection[]): PublicRendererContext {
  return {
    page: {
      id: "page",
      title: "Página",
      slug: "pagina",
      template: { key: "real_estate" },
      templateVariant: { key: "local_agency" },
      theme: null,
      sections,
      forms: [],
    },
    site: {
      businessName: "Empresa",
      businessType: null,
      contactEmail: "",
      contactPhone: null,
      city: null,
      country: null,
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      accentColor: "#000000",
      logoMedia: null,
    },
  };
}

describe("public hero heading hierarchy", () => {
  it("marks only the first generic hero as the primary heading", () => {
    const sections = [
      section("hero-main", "hero"),
      section("hero-about", "hero"),
    ];
    const pageContext = context(sections);

    expect(isPrimaryHeroSection(sections[0], pageContext)).toBe(true);
    expect(isPrimaryHeroSection(sections[1], pageContext)).toBe(false);
  });

  it("keeps the first specialized hero primary when legacy generic heroes follow", () => {
    const sections = [
      section("hero-main", "real_estate_hero"),
      section("hero-about", "hero"),
    ];
    const pageContext = context(sections);

    expect(isPrimaryHeroSection(sections[0], pageContext)).toBe(true);
    expect(isPrimaryHeroSection(sections[1], pageContext)).toBe(false);
  });
});
