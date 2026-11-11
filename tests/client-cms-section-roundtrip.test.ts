import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

const previewState = vi.hoisted(() => ({
  templateKey: "restaurant",
  variantKey: "playful",
  templateVersion: "restaurant/playful@test",
  sections: [] as unknown[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/exports/client-runtime/cms/authorization", () => ({
  getActorInstallation: (actor: { installation: unknown }) => actor.installation,
}));
vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => ({
    query: async (sql: string) => sql.includes("SELECT i.template_key")
      ? { rows: [{
          template_key: previewState.templateKey,
          variant_key: previewState.variantKey,
          template_version: previewState.templateVersion,
          id: pageId,
          title: "Mesa QA",
          slug: "mesa-qa",
          theme: { primaryColor: "#111", secondaryColor: "#222", accentColor: "#333", backgroundColor: "#fff", surfaceColor: "#fff", textPrimaryColor: "#111", textSecondaryColor: "#444", headingFont: "Arial", bodyFont: "Arial", borderRadius: "0" },
          seo: {},
          sections: previewState.sections,
        }] }
      : { rows: [] },
  }),
  withClientCmsTransaction: async (operation: (client: PoolClient) => Promise<unknown>) => operation({} as PoolClient),
}));

import { updateClientCmsSection } from "@/features/exports/client-runtime/cms/content.service";
import { getClientCmsPreviewPayload } from "@/features/exports/client-runtime/cms/public-page.service";
import type { AuthorizedClientCmsContext } from "@/features/exports/client-runtime/cms/contracts";

const projectId = "950e8400-e29b-41d4-a716-446655440000";
const sectionId = "950e8400-e29b-41d4-a716-446655440001";
const pageId = "950e8400-e29b-41d4-a716-446655440002";
const originalContent = {
  title: "Pratos de assinatura",
  text: "Conteúdo anterior.",
  layout: "playful",
  items: [{ label: "Social", title: "Pratos para partilhar", description: "Descrição original.", image: "https://example.invalid/dish.jpg", imageAlt: "Prato original", rendererTag: "keep-me" }],
};

const actor: AuthorizedClientCmsContext = {
  userId: "user-qa",
  projectId,
  role: "client_admin",
  authorizationVersion: 1,
  installation: {
    projectId,
    templateKey: "restaurant",
    variantKey: "playful",
    templateVersion: "restaurant/playful@test",
    sourceChecksum: "a".repeat(64),
    capabilities: [{ sectionKey: "signature-dishes", sectionType: "restaurant_signature_dishes", editableFields: ["items", "text", "title"] }],
  },
};

function createTransaction(
  sectionType = "restaurant_signature_dishes",
  sectionKey = "signature-dishes",
  existingContent: Record<string, unknown> = originalContent,
) {
  let savedContent: Record<string, unknown> | undefined;
  const client = {
    query: async (sql: string, values?: unknown[]) => {
      if (sql.includes("SELECT id, page_id, section_key, section_type, content")) {
        return { rows: [{ id: sectionId, page_id: pageId, section_key: sectionKey, section_type: sectionType, content: existingContent }] };
      }
      if (sql.startsWith("UPDATE lf_cms_sections SET content")) {
        savedContent = JSON.parse(String(values?.[3])) as Record<string, unknown>;
      }
      return { rows: [] };
    },
  };
  const transaction = (async (operation: (client: PoolClient) => Promise<unknown>) => operation(client as unknown as PoolClient)) as Parameters<typeof updateClientCmsSection>[2];
  return { transaction, getSavedContent: () => savedContent };
}

describe("Client CMS structured section round-trip", () => {
  it("updates supported fields while preserving template data through the same section payload", async () => {
    const { transaction, getSavedContent } = createTransaction();
    await updateClientCmsSection(actor, {
      pageId,
      sectionId,
      content: {
        title: "Favoritos da casa",
        text: "Nova introdução.",
        items: [{ label: "Para partilhar", title: "Tacos da casa", description: "Com ervas frescas.", image: "https://example.invalid/new.jpg", imageAlt: "Tacos preparados para partilhar", rendererTag: "keep-me" }],
      },
    }, transaction);

    expect(getSavedContent()).toEqual({
      ...originalContent,
      title: "Favoritos da casa",
      text: "Nova introdução.",
      items: [{ label: "Para partilhar", title: "Tacos da casa", description: "Com ervas frescas.", image: "https://example.invalid/new.jpg", imageAlt: "Tacos preparados para partilhar", rendererTag: "keep-me" }],
    });

    previewState.sections = [{ sectionKey: "signature-dishes", sectionType: "restaurant_signature_dishes", name: "Pratos", sortOrder: 1, content: getSavedContent(), settings: {} }];
    const previousVersion = process.env.CLIENT_CMS_TEMPLATE_VERSION;
    process.env.CLIENT_CMS_TEMPLATE_VERSION = "restaurant/playful@test";
    const preview = await getClientCmsPreviewPayload(actor);
    if (previousVersion === undefined) delete process.env.CLIENT_CMS_TEMPLATE_VERSION;
    else process.env.CLIENT_CMS_TEMPLATE_VERSION = previousVersion;
    expect(preview?.page.sections[0].content).toEqual(getSavedContent());
  });

  it("validates newly structured gallery fields on the server", async () => {
    const galleryActor = {
      ...actor,
      installation: {
        ...actor.installation,
        capabilities: [{ sectionKey: "gallery", sectionType: "restaurant_gallery", editableFields: ["items"] }],
      },
    } satisfies AuthorizedClientCmsContext;
    const { transaction } = createTransaction("restaurant_gallery", "gallery");
    await expect(updateClientCmsSection(galleryActor, {
      pageId,
      sectionId,
      content: { items: [{ label: "Sala", image: "https://example.invalid/sala.jpg" }] },
    }, transaction)).rejects.toThrow("Preenche imageAlt no item 1.");
  });

  it("rejects fields outside the pinned capability before persisting", async () => {
    const limitedActor: AuthorizedClientCmsContext = {
      ...actor,
      installation: {
        ...actor.installation,
        capabilities: [{ sectionKey: "signature-dishes", sectionType: "restaurant_signature_dishes", editableFields: ["title"] }],
      },
    };
    const { transaction, getSavedContent } = createTransaction();
    await expect(updateClientCmsSection(limitedActor, {
      pageId,
      sectionId,
      content: { title: "Editável", items: originalContent.items },
    }, transaction)).rejects.toThrow("não são editáveis nesta versão");
    expect(getSavedContent()).toBeUndefined();
  });

  it("rejects a section type that does not match the pinned section capability", async () => {
    const mismatchedActor: AuthorizedClientCmsContext = {
      ...actor,
      installation: {
        ...actor.installation,
        capabilities: [{ sectionKey: "signature-dishes", sectionType: "clinic_faq", editableFields: ["items"] }],
      },
    };
    const { transaction, getSavedContent } = createTransaction();
    await expect(updateClientCmsSection(mismatchedActor, {
      pageId,
      sectionId,
      content: { items: [{ question: "Pergunta", answer: "Resposta" }] },
    }, transaction)).rejects.toThrow("não pertence às capacidades da versão fixada");
    expect(getSavedContent()).toBeUndefined();
  });

  it("enforces FAQ collection bounds at the server write boundary", async () => {
    const faqActor: AuthorizedClientCmsContext = {
      ...actor,
      installation: {
        ...actor.installation,
        capabilities: [{ sectionKey: "faq", sectionType: "clinic_faq", editableFields: ["items"] }],
      },
    };
    const items = Array.from({ length: 30 }, (_, index) => ({ question: `Pergunta ${index + 1}`, answer: `Resposta ${index + 1}` }));
    const atLimit = createTransaction("clinic_faq", "faq", { items: [] });
    await updateClientCmsSection(faqActor, { pageId, sectionId, content: { items } }, atLimit.transaction);
    expect(atLimit.getSavedContent()?.items).toHaveLength(30);

    const overLimit = createTransaction("clinic_faq", "faq", { items: [] });
    await expect(updateClientCmsSection(faqActor, {
      pageId,
      sectionId,
      content: { items: [...items, { question: "Pergunta 31", answer: "Resposta 31" }] },
    }, overLimit.transaction)).rejects.toThrow("formato ou dimensão inválidos");
    expect(overLimit.getSavedContent()).toBeUndefined();
  });

  it.each([
    {
      templateKey: "clinic",
      variantKey: "modern",
      templateVersion: "clinic/modern@test",
      sectionKey: "specialties",
      sectionType: "clinic_specialties",
      collectionKey: "specialties",
      editableFields: ["title", "specialties"],
      existing: {
        title: "Especialidades",
        specialties: [{ title: "Cardiologia", description: "Acompanhamento clínico.", rendererTag: "clinic-v1" }],
        presentationMode: "clinical",
      },
      patch: {
        title: "Áreas clínicas",
        specialties: [{ title: "Cardiologia e prevenção", description: "Acompanhamento clínico.", rendererTag: "clinic-v1" }],
      },
      expected: {
        title: "Áreas clínicas",
        specialties: [{ title: "Cardiologia e prevenção", description: "Acompanhamento clínico.", rendererTag: "clinic-v1" }],
        presentationMode: "clinical",
      },
    },
    {
      templateKey: "real_estate",
      variantKey: "premium",
      templateVersion: "real_estate/premium@test",
      sectionKey: "featured-properties",
      sectionType: "featured_properties",
      collectionKey: "properties",
      editableFields: ["title", "properties"],
      existing: {
        title: "Imóveis em destaque",
        properties: [{ title: "Moradia", location: "Porto", price: "420 000 €", propertyId: "legacy-property-1" }],
        cardDensity: "premium",
      },
      patch: {
        title: "Seleção atual",
        properties: [{ title: "Moradia renovada", location: "Porto", price: "420 000 €", propertyId: "legacy-property-1" }],
      },
      expected: {
        title: "Seleção atual",
        properties: [{ title: "Moradia renovada", location: "Porto", price: "420 000 €", propertyId: "legacy-property-1" }],
        cardDensity: "premium",
      },
    },
    {
      templateKey: "bakery",
      variantKey: "artisan",
      templateVersion: "bakery/artisan@test",
      sectionKey: "products",
      sectionType: "bakery_products",
      collectionKey: "products",
      editableFields: ["title", "products"],
      existing: {
        title: "Produtos da casa",
        products: [{ title: "Pão de massa-mãe", description: "Fermentação lenta.", price: "4 €", image: "/assets/bread.avif", imageAlt: "Pão artesanal", rendererSlot: "featured" }],
        themePreset: "artisan",
      },
      patch: {
        title: "Forno de hoje",
        products: [{ title: "Pão de massa-mãe", description: "Fermentação lenta de 24 horas.", price: "4 €", image: "/assets/bread.avif", imageAlt: "Pão artesanal", rendererSlot: "featured" }],
      },
      expected: {
        title: "Forno de hoje",
        products: [{ title: "Pão de massa-mãe", description: "Fermentação lenta de 24 horas.", price: "4 €", image: "/assets/bread.avif", imageAlt: "Pão artesanal", rendererSlot: "featured" }],
        themePreset: "artisan",
      },
    },
    {
      templateKey: "gym",
      variantKey: "performance",
      templateVersion: "gym/performance@test",
      sectionKey: "classes",
      sectionType: "gym_classes",
      collectionKey: "classes",
      editableFields: ["title", "classes"],
      existing: {
        title: "Aulas semanais",
        classes: [{ title: "Força funcional", description: "Sessão orientada.", level: "Todos os níveis", rendererPosition: 1 }],
        scheduleStyle: "weekly-grid",
      },
      patch: {
        title: "Treino em grupo",
        classes: [{ title: "Força funcional", description: "Sessão orientada por treinador.", level: "Todos os níveis", rendererPosition: 1 }],
      },
      expected: {
        title: "Treino em grupo",
        classes: [{ title: "Força funcional", description: "Sessão orientada por treinador.", level: "Todos os níveis", rendererPosition: 1 }],
        scheduleStyle: "weekly-grid",
      },
    },
  ])("round-trips $templateKey content through its pinned capabilities and private preview", async (scenario) => {
    const familyActor: AuthorizedClientCmsContext = {
      ...actor,
      installation: {
        ...actor.installation,
        templateKey: scenario.templateKey,
        variantKey: scenario.variantKey,
        templateVersion: scenario.templateVersion,
        capabilities: [{ sectionKey: scenario.sectionKey, sectionType: scenario.sectionType, editableFields: scenario.editableFields }],
      },
    };
    const { transaction, getSavedContent } = createTransaction(scenario.sectionType, scenario.sectionKey, scenario.existing);
    await updateClientCmsSection(familyActor, { pageId, sectionId, content: scenario.patch }, transaction);
    expect(getSavedContent()).toEqual(scenario.expected);

    previewState.templateKey = scenario.templateKey;
    previewState.variantKey = scenario.variantKey;
    previewState.templateVersion = scenario.templateVersion;
    previewState.sections = [{
      sectionKey: scenario.sectionKey,
      sectionType: scenario.sectionType,
      name: scenario.sectionType,
      sortOrder: 1,
      content: getSavedContent(),
      settings: {},
    }];
    const previousVersion = process.env.CLIENT_CMS_TEMPLATE_VERSION;
    process.env.CLIENT_CMS_TEMPLATE_VERSION = scenario.templateVersion;
    try {
      const preview = await getClientCmsPreviewPayload(familyActor);
      expect(preview?.templateKey).toBe(scenario.templateKey);
      expect(preview?.variantKey).toBe(scenario.variantKey);
      expect(preview?.templateVersion).toBe(scenario.templateVersion);
      expect(preview?.page.sections[0].content).toEqual(scenario.expected);
    } finally {
      if (previousVersion === undefined) delete process.env.CLIENT_CMS_TEMPLATE_VERSION;
      else process.env.CLIENT_CMS_TEMPLATE_VERSION = previousVersion;
    }
  });

  it("rejects a preview when the installed runtime version differs from the pinned package", async () => {
    const clinicActor: AuthorizedClientCmsContext = {
      ...actor,
      installation: {
        ...actor.installation,
        templateKey: "clinic",
        variantKey: "modern",
        templateVersion: "clinic/modern@2.0.0",
      },
    };
    previewState.templateKey = "clinic";
    previewState.variantKey = "modern";
    previewState.templateVersion = "clinic/modern@2.0.0";
    previewState.sections = [];
    const previousVersion = process.env.CLIENT_CMS_TEMPLATE_VERSION;
    process.env.CLIENT_CMS_TEMPLATE_VERSION = "clinic/modern@1.0.0";
    try {
      await expect(getClientCmsPreviewPayload(clinicActor)).rejects.toThrow(
        "A página não corresponde à versão do runtime instalado.",
      );
    } finally {
      if (previousVersion === undefined) delete process.env.CLIENT_CMS_TEMPLATE_VERSION;
      else process.env.CLIENT_CMS_TEMPLATE_VERSION = previousVersion;
      previewState.templateKey = "restaurant";
      previewState.variantKey = "playful";
      previewState.templateVersion = "restaurant/playful@test";
      previewState.sections = [];
    }
  });
});
