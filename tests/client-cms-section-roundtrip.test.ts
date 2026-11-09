import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

const previewState = vi.hoisted(() => ({ sections: [] as unknown[] }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/exports/client-runtime/cms/authorization", () => ({
  getActorInstallation: (actor: { installation: unknown }) => actor.installation,
}));
vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => ({
    query: async (sql: string) => sql.includes("SELECT i.template_key")
      ? { rows: [{
          template_key: "restaurant",
          variant_key: "playful",
          template_version: "restaurant/playful@test",
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
    capabilities: [{ sectionKey: "signature-dishes", sectionType: "restaurant_signature_dishes", editableFields: ["items", "layout", "text", "title"] }],
  },
};

function createTransaction(sectionType = "restaurant_signature_dishes", sectionKey = "signature-dishes") {
  let savedContent: Record<string, unknown> | undefined;
  const client = {
    query: async (sql: string, values?: unknown[]) => {
      if (sql.includes("SELECT id, page_id, section_key, section_type, content")) {
        return { rows: [{ id: sectionId, page_id: pageId, section_key: sectionKey, section_type: sectionType, content: originalContent }] };
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
});
