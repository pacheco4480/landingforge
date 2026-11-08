import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicBaseStyles } from "@/features/public-renderer/components/public-base-styles";
import { PublicSectionList } from "@/features/public-renderer/components/public-section-list";
import type { PublicRendererContext, PublicSectionProps } from "@/features/public-renderer/types";

describe("public section rendering safeguards", () => {
  it("does not render hidden sections in the authenticated preview", () => {
    const hiddenSection = {
      id: "hidden-faq",
      sectionKey: "faq",
      sectionType: "faq",
      name: "FAQ oculta",
      sortOrder: 1,
      isVisible: false,
      content: { title: "FAQ oculta" },
      settings: {},
    };
    const context = {
      previewMode: true,
      page: { template: { key: "base" }, sections: [hiddenSection] },
    } as unknown as PublicRendererContext;
    const renderSection = ({ section }: PublicSectionProps) =>
      createElement("p", null, section.name);

    const html = renderToStaticMarkup(
      createElement(PublicSectionList, {
        context,
        registry: { faq: renderSection },
      }),
    );

    expect(html).not.toContain("FAQ oculta");
  });

  it("renders known Real Estate sections with their template-specific components when legacy data says hero", () => {
    const section = {
      id: "featured-properties",
      sectionKey: "featured-properties",
      sectionType: "hero",
      name: "Imóveis selecionados",
      sortOrder: 1,
      isVisible: true,
      content: { title: "Casas selecionadas" },
      settings: {},
    };
    const context = {
      page: { template: { key: "real_estate" }, sections: [section] },
    } as unknown as PublicRendererContext;
    const renderType = ({ section: rendered }: PublicSectionProps) =>
      createElement("p", null, rendered.sectionType);
    const genericHero = () => createElement("p", null, "generic hero");

    const html = renderToStaticMarkup(
      createElement(PublicSectionList, {
        context,
        registry: { hero: genericHero, featured_properties: renderType },
      }),
    );

    expect(html).toContain("featured_properties");
    expect(html).not.toContain("generic hero");
  });

  it("disables CSS animation, transitions and smooth scrolling when reduced motion is requested", () => {
    const html = renderToStaticMarkup(createElement(PublicBaseStyles));

    expect(html).toContain("prefers-reduced-motion: reduce");
    expect(html).toContain("animation: none !important");
    expect(html).toContain("transition: none !important");
    expect(html).toContain("scroll-behavior: auto !important");
  });
});
