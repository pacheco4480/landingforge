import { describe, expect, it } from "vitest";

import { buildClientRuntimePayload } from "@/features/exports/services/client-runtime-payload";
import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";

type SnapshotInput = Parameters<typeof buildProjectSourceSnapshot>[0];

const page = {
  id: "master-page-id",
  title: "Casa do Bairro",
  slug: "casa-do-bairro",
  template: { key: "restaurant" },
  templateVariant: { key: "playful" },
  theme: {
    name: "Internal theme name",
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
    settings: { internalThemeSetting: "do-not-export" },
  },
  sections: [
    {
      sectionKey: "hidden-internal-section",
      sectionType: "restaurant_hero",
      name: "Hidden section",
      sortOrder: 2,
      isVisible: false,
      content: { headline: "Do not export" },
      settings: {},
    },
    {
      sectionKey: "hero",
      sectionType: "restaurant_hero",
      name: "Hero",
      sortOrder: 0,
      isVisible: true,
      content: { headline: "Uma noite para partilhar" },
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
      gdprConsentRequired: true,
      gdprConsentLabel: "Li e aceito a Política de Privacidade.",
      gdprConsentVersion: "1.0",
      recipientEmail: "private-inbox@example.test",
      fields: [
        {
          label: "Campo interno oculto",
          name: "internal",
          type: "TEXT",
          placeholder: null,
          helpText: null,
          defaultValue: null,
          options: null,
          validation: null,
          conditionalLogic: null,
          sortOrder: 1,
          isRequired: false,
          isVisible: false,
        },
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
    metaTitle: "Casa do Bairro | Restaurante",
    metaDescription: "Cozinha portuguesa para partilhar.",
    keywords: null,
    canonicalUrl: "https://master.invalid/canonical-must-not-ship",
    ogTitle: null,
    ogDescription: null,
    twitterCardType: "summary_large_image",
    robotsIndex: false,
    robotsFollow: false,
    schemaJson: { internalSchema: true },
  },
} as unknown as SnapshotInput;

function buildPayload(input: SnapshotInput = page) {
  return buildClientRuntimePayload(buildProjectSourceSnapshot(input).snapshot);
}

describe("client runtime payload", () => {
  it("exports only the public allowlisted page, theme, visible sections, forms and SEO", () => {
    const payload = buildPayload();
    const serialized = JSON.stringify(payload);

    expect(payload).toMatchObject({
      format: "landingforge-client-runtime",
      formatVersion: 1,
      templateKey: "restaurant",
      variantKey: "playful",
      page: {
        slug: "casa-do-bairro",
        sections: [{ sectionKey: "hero", sortOrder: 0 }],
        forms: [{
          key: "reservation",
          gdprConsentRequired: true,
          gdprConsentLabel: "Li e aceito a Política de Privacidade.",
          gdprConsentVersion: "1.0",
          fields: [{ name: "name" }],
        }],
      },
    });
    expect(payload.page.theme).not.toHaveProperty("name");
    expect(payload.page.theme).not.toHaveProperty("settings");
    expect(payload.page.seo).not.toHaveProperty("canonicalUrl");
    expect(serialized).not.toContain("master-page-id");
    expect(serialized).not.toContain("private-inbox@example.test");
    expect(serialized).not.toContain("hidden-internal-section");
    expect(serialized).not.toContain("internalThemeSetting");
    expect(serialized).not.toContain("internalSchema");
  });

  it("fails closed when a public content field contains a recognizable credential", () => {
    const credentialPage: SnapshotInput = {
      ...page,
      sections: [{
        ...page.sections[1],
content: { headline: "RESEND_API_KEY=re_000000000000000000000000000000000000" },
      }],
    };

    expect(() => buildPayload(credentialPage)).toThrow("O conteúdo público contém material com aspeto de credencial");
  });

  it("fails closed when CMS JSON includes an internal note at any nesting depth", () => {
    const internalNotePage: SnapshotInput = {
      ...page,
      sections: [{
        ...page.sections[1],
        content: { details: { internalNotes: "Não publicar" } },
      }],
    };

    expect(() => buildPayload(internalNotePage)).toThrow("é interno e não pode integrar o runtime público");
  });

  it("fails schema validation when a required visual token is absent", () => {
    const snapshot = buildProjectSourceSnapshot(page).snapshot;
    const incomplete = {
      ...snapshot,
      page: {
        ...snapshot.page,
        theme: { ...snapshot.page.theme!, primaryColor: undefined },
      },
    } as unknown as typeof snapshot;

    expect(() => buildClientRuntimePayload(incomplete)).toThrow();
  });

  it("rejects CSS injection in public theme tokens", () => {
    const unsafePage: SnapshotInput = {
      ...page,
      theme: { ...page.theme!, primaryColor: "red; background:url(https://attacker.invalid)" },
    };

    expect(() => buildPayload(unsafePage)).toThrow();
  });

  it("requires snapshot integrity verification when an expected checksum is supplied", () => {
    const { snapshot, checksum } = buildProjectSourceSnapshot(page);

    expect(buildClientRuntimePayload(snapshot, checksum).page.slug).toBe("casa-do-bairro");
    expect(() => buildClientRuntimePayload(snapshot, "f".repeat(64))).toThrow("checksum");
  });
});
