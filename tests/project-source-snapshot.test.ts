import { describe, expect, it } from "vitest";

import {
  buildProjectSourceSnapshot,
  overrideProjectSourceSnapshotSlug,
  validateProjectSourceSnapshot,
} from "@/features/exports/services/project-source-snapshot";
import { buildProjectReviewPreview } from "@/features/briefings/project-review-preview";

const page = {
  id: "source-page-id",
  title: "Marca de demonstração",
  slug: "demo-page",
  template: { key: "restaurant" },
  templateVariant: { key: "playful" },
  theme: {
    name: "Boca Pop",
    primaryColor: "#e35b46",
    secondaryColor: "#f7c85a",
    accentColor: "#126b56",
    backgroundColor: "#fff7ec",
    surfaceColor: "#ffffff",
    textPrimaryColor: "#24211d",
    textSecondaryColor: "#685f56",
    headingFont: "DM Sans",
    bodyFont: "Inter",
    borderRadius: "16px",
    shadowStyle: "soft",
    settings: { density: "comfortable" },
  },
  sections: [
    {
      sectionKey: "hero",
      sectionType: "restaurant_hero",
      name: "Hero",
      sortOrder: 0,
      isVisible: true,
      content: { headline: "Uma noite para partilhar", brandName: "Marca" },
      settings: { presentationVariant: "bold" },
    },
  ],
  forms: [
    {
      name: "Reserva",
      key: "reservation",
      type: "BOOKING",
      successMessage: "Pedido recebido.",
      errorMessage: "Tente novamente.",
      recipientEmail: "internal@example.test",
      fields: [
        {
          label: "Nome",
          name: "name",
          type: "TEXT",
          placeholder: null,
          helpText: null,
          defaultValue: null,
          options: null,
          validation: { maxLength: 100 },
          conditionalLogic: null,
          sortOrder: 0,
          isRequired: true,
          isVisible: true,
        },
      ],
    },
  ],
  seoSetting: {
    metaTitle: "Demo SEO title",
    metaDescription: "Demo SEO description",
    keywords: null,
    canonicalUrl: "https://example.test/demo-page",
    ogTitle: null,
    ogDescription: null,
    twitterCardType: "summary_large_image",
    robotsIndex: false,
    robotsFollow: false,
    schemaJson: { name: "Marca fictícia" },
  },
};

describe("project source snapshot", () => {
  it("captures template capabilities from actual sections and form fields", () => {
    const { snapshot } = buildProjectSourceSnapshot(page);

    expect(snapshot.capabilities).toEqual({
      sectionTypes: ["restaurant_hero"],
      sections: [{ key: "hero", type: "restaurant_hero", editableFields: ["brandName", "headline"] }],
      forms: [{ key: "reservation", fields: ["name"] }],
    });
  });

  it("omits recipient and demo-specific canonical/schema metadata", () => {
    const { snapshot } = buildProjectSourceSnapshot(page);
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain("internal@example.test");
    expect(serialized).not.toContain("canonicalUrl");
    expect(serialized).not.toContain("schemaJson");
    expect(serialized).not.toContain("Marca fictícia");
  });

  it("uses a stable client-facing slug without changing the internal candidate record", () => {
    const built = buildProjectSourceSnapshot({ ...page, slug: "maintenance-internal-123" });
    const publicSnapshot = overrideProjectSourceSnapshotSlug(built, "clinica-cliente");

    expect(publicSnapshot.snapshot.page.slug).toBe("clinica-cliente");
    expect(publicSnapshot.checksum).not.toBe(built.checksum);
    expect(built.snapshot.page.slug).toBe("maintenance-internal-123");
    expect(validateProjectSourceSnapshot(publicSnapshot.snapshot, publicSnapshot.checksum).page.slug).toBe("clinica-cliente");
  });

  it("includes an independent theme snapshot for project-specific branding", () => {
    const { snapshot } = buildProjectSourceSnapshot({
      ...page,
      theme: { ...page.theme, id: "internal-theme-id", key: "internal-theme-key", createdAt: new Date(), updatedAt: new Date() } as never,
    });

    expect(snapshot.page.theme).toMatchObject({
      name: "Boca Pop",
      primaryColor: "#e35b46",
      headingFont: "DM Sans",
      settings: { density: "comfortable" },
    });
    expect(snapshot.page.theme).not.toHaveProperty("id");
    expect(snapshot.page.theme).not.toHaveProperty("key");
    expect(snapshot.page.theme).not.toHaveProperty("createdAt");
  });

  it("fails closed when a page contains a section type absent from the template registry", () => {
    expect(() => buildProjectSourceSnapshot({
      ...page,
      sections: [{ ...page.sections[0], sectionType: "internal_unregistered_section" }],
    })).toThrow("O template não declara suporte para as secções: internal_unregistered_section.");
  });

  it("fails closed when the selected template has no declared export definition", () => {
    expect(() => buildProjectSourceSnapshot({
      ...page,
      template: { key: "unregistered-template" },
    })).toThrow("O template selecionado não tem uma definição de secções exportável.");
  });

  it("creates a deterministic checksum independent of JSON object key order", () => {
    const reorderedPage = {
      ...page,
      sections: [{ ...page.sections[0], content: { brandName: "Marca", headline: "Uma noite para partilhar" } }],
    };

    expect(buildProjectSourceSnapshot(reorderedPage).checksum).toBe(
      buildProjectSourceSnapshot(page).checksum,
    );
    expect(buildProjectSourceSnapshot(page).templateVersion).toBe("restaurant/playful@1.0.0");
  });

  it("validates the snapshot schema, declared capabilities and checksum before consumption", () => {
    const built = buildProjectSourceSnapshot(page);

    expect(validateProjectSourceSnapshot(built.snapshot, built.checksum)).toEqual(built.snapshot);
    expect(() => validateProjectSourceSnapshot(built.snapshot, "0".repeat(64))).toThrow("checksum");

    const tampered = {
      ...built.snapshot,
      capabilities: { ...built.snapshot.capabilities, sectionTypes: ["clinic_hero"] },
    };
    expect(() => validateProjectSourceSnapshot(tampered)).toThrow("manifesto de capacidades");
  });

  it("builds an isolated, non-interactive review context from the pinned snapshot", () => {
    const built = buildProjectSourceSnapshot(page);
    const preview = buildProjectReviewPreview(
      built.snapshot,
      built.checksum,
      "Restaurante do Cliente",
    );

    expect(preview.previewMode).toBe(true);
    expect(preview.page).toMatchObject({
      title: "Marca de demonstração",
      slug: "demo-page",
      template: { key: "restaurant" },
      templateVariant: { key: "playful" },
      sections: [
        {
          id: "hero",
          sectionKey: "hero",
          sectionType: "restaurant_hero",
        },
      ],
      forms: [{ id: "reservation", fields: [{ id: "name" }] }],
    });
    expect(preview.site).toMatchObject({
      businessName: "Restaurante do Cliente",
      contactEmail: "",
      contactPhone: null,
      city: null,
      country: null,
      logoMedia: null,
    });
  });

  it("rejects a tampered review snapshot before rendering", () => {
    const built = buildProjectSourceSnapshot(page);
    const tampered = {
      ...built.snapshot,
      page: { ...built.snapshot.page, title: "Conteúdo alterado" },
    };

    expect(() =>
      buildProjectReviewPreview(tampered, built.checksum, "Cliente"),
    ).toThrow("checksum");
  });

  it("rejects duplicate section/form keys and fields outside the strict snapshot contract", () => {
    const built = buildProjectSourceSnapshot(page);
    const duplicateSections = {
      ...built.snapshot,
      page: {
        ...built.snapshot.page,
        sections: [...built.snapshot.page.sections, built.snapshot.page.sections[0]],
      },
    };
    expect(() => validateProjectSourceSnapshot(duplicateSections)).toThrow("chaves de secção duplicados");

    expect(() => validateProjectSourceSnapshot({ ...built.snapshot, privateNotes: "do not export" })).toThrow();
  });
});
