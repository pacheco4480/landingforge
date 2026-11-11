import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StructuredContentFields } from "@/features/exports/client-runtime/cms/components/structured-content-fields";
import { editableContentKeys, getContentCollections, getNewCollectionItem, mergeStructuredContent, parseNumericFieldValue, validateStructuredContent } from "@/features/exports/client-runtime/cms/content-editor-schema";
import { getTemplateDefinition } from "@/features/public-renderer/template-registry";

describe("structured CMS content contract", () => {
  it("keeps an empty numeric input empty instead of coercing it to zero", () => {
    expect(parseNumericFieldValue("")).toBe("");
    expect(parseNumericFieldValue("0")).toBe(0);
    expect(parseNumericFieldValue("12.5")).toBe(12.5);
  });

  it("allows relative asset URLs in both section and collection editors", () => {
    const section = { image: "/assets/legacy.avif", email: "studio@example.invalid" };
    const sectionMarkup = renderToStaticMarkup(createElement(StructuredContentFields, {
      sectionType: "restaurant_reviews",
      idPrefix: "section",
      content: section,
      editableFields: editableContentKeys(section),
      onChange: () => undefined,
    }));
    expect(sectionMarkup).toContain('aria-label="Endereço da imagem"');
    expect(sectionMarkup).toContain('inputMode="url"');
    expect(sectionMarkup).toContain('value="/assets/legacy.avif"');
    expect(sectionMarkup).toContain('type="email"');

    const collection = { items: [{ name: "Rita", image: "/assets/reviewer.avif", imageAlt: "Rita" }] };
    const collectionMarkup = renderToStaticMarkup(createElement(StructuredContentFields, {
      sectionType: "restaurant_reviews",
      idPrefix: "reviews",
      content: collection,
      editableFields: editableContentKeys(collection),
      onChange: () => undefined,
    }));
    expect(collectionMarkup).toContain('aria-label="Endereço da imagem, item 1"');
    expect(collectionMarkup).toContain('value="/assets/reviewer.avif"');
    expect(collectionMarkup).not.toContain('type="url"');
  });

  it("exposes semantic fields and collections while retaining technical values", () => {
    const content = {
      headline: "A sua clínica", brandKit: { accent: "#123456" }, headerVariant: "minimal",
      items: [{ title: "Card", description: "Texto", rendererConfig: { density: "compact" } }],
    };
    expect(editableContentKeys(content)).toEqual(["headline", "items"]);
    expect(getContentCollections("clinic_specialties", content, ["items"])[0].fields.map(({ key }) => key)).toEqual(["title", "description"]);
  });

  it("covers every section type currently supported by the template registry", () => {
    const templates = ["base", "universal", "real_estate", "clinic", "restaurant", "bakery", "gym", "construction", "beauty"];
    const types = new Set(templates.flatMap((key) => getTemplateDefinition(key)?.supportedSections ?? []));
    expect(types.size).toBeGreaterThan(50);
    expect([...types].every((type) => typeof type === "string" && type.length > 0)).toBe(true);
  });

  it("validates edits against the installed keys and limits while preserving legacy item keys", () => {
    const existing = { items: [{ question: "Pergunta", answer: "Resposta", rendererTag: "legacy" }] };
    const patch = { items: [{ question: "Nova pergunta", answer: "Nova resposta", rendererTag: "legacy" }] };
    expect(() => validateStructuredContent("clinic_faq", patch, ["items"], existing)).not.toThrow();
    expect(mergeStructuredContent(existing, patch)).toEqual(patch);
    expect(() => validateStructuredContent("clinic_faq", { adminNotes: "x" }, ["items"], existing)).toThrow();
    expect(() => validateStructuredContent("clinic_faq", { items: Array.from({ length: 31 }, () => ({})) }, ["items"], existing)).toThrow();
  });

  it("accepts the exact collection limit and rejects the next item with valid payloads", () => {
    const faqItems = Array.from({ length: 30 }, (_, index) => ({ question: `Pergunta ${index + 1}`, answer: `Resposta ${index + 1}` }));
    const atLimit = { items: faqItems };
    expect(() => validateStructuredContent("clinic_faq", atLimit, ["items"], { items: [] })).not.toThrow();
    expect(() => validateStructuredContent("clinic_faq", { items: [...faqItems, { question: "Pergunta 31", answer: "Resposta 31" }] }, ["items"], { items: [] })).toThrow("formato ou dimensão inválidos");
  });

  it("renders the add action disabled when a repeatable collection reaches its limit", () => {
    const content = { items: Array.from({ length: 30 }, (_, index) => ({ question: `Pergunta ${index + 1}`, answer: `Resposta ${index + 1}` })) };
    const markup = renderToStaticMarkup(createElement(StructuredContentFields, {
      sectionType: "clinic_faq",
      idPrefix: "faq-limit",
      content,
      editableFields: ["items"],
      onChange: () => undefined,
    }));
    expect(markup).toContain("Perguntas frequentes (30/30)");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Adicionar item<\/button>/);
  });

  it("does not allow changes to unknown legacy item fields", () => {
    const existing = { items: [{ title: "Item", legacyFlag: true }] };
    expect(() => validateStructuredContent("gym_programs", { items: [{ title: "Alterado", legacyFlag: false }] }, ["items"], existing)).toThrow();
    expect(mergeStructuredContent(existing, { items: [{ title: "Atualizado", legacyFlag: true }] })).toEqual({
      items: [{ title: "Atualizado", legacyFlag: true }],
    });
  });

  it("moves preserved legacy item fields with their collection item", () => {
    const existing = { items: [{ title: "A", rendererTag: "first" }, { title: "B", rendererTag: "second" }] };
    const patch = { items: [{ title: "B", rendererTag: "second" }, { title: "A", rendererTag: "first" }] };
    expect(() => validateStructuredContent("gym_programs", patch, ["items"], existing)).not.toThrow();
    expect(mergeStructuredContent(existing, patch)).toEqual(patch);
  });

  it("accepts an empty content patch without clearing persisted content", () => {
    const existing = { rendererMode: "clinic", internalFlag: true };
    expect(mergeStructuredContent(existing, {})).toEqual(existing);
  });

  it("starts empty FAQ, review and restaurant menu items with the fields and limits their validators require", () => {
    expect(getNewCollectionItem("restaurant_menu_highlights", "items", [])).toEqual({ category: "", title: "", description: "", price: "" });
    expect(getContentCollections("restaurant_menu_highlights", { items: [{ category: "Entrada", title: "Prato", description: "Descrição", price: "€" }] }, ["items"])[0].fields.map(({ key, maxLength, optional }) => [key, maxLength, optional])).toEqual([
      ["category", 80, false], ["title", 120, false], ["description", 500, false], ["price", 40, true],
    ]);
    expect(getNewCollectionItem("clinic_faq", "items", [])).toEqual({ question: "", answer: "" });
    expect(getNewCollectionItem("restaurant_reviews", "items", [])).toEqual({ name: "", quote: "", context: "" });
  });

  it("enforces collection-profile requirements and limits on the server while allowing unchanged legacy gaps", () => {
    const faq = { items: [{ question: "Pergunta", answer: "Resposta" }] };
    expect(() => validateStructuredContent("clinic_faq", { items: [{ question: "", answer: "Resposta" }] }, ["items"], faq)).toThrow("Pergunta");
    expect(() => validateStructuredContent("clinic_faq", { items: [{ question: "Pergunta" }] }, ["items"], { items: [] })).toThrow("Resposta");
    expect(() => validateStructuredContent("restaurant_menu_highlights", { items: [{ category: "x".repeat(81), title: "Prato", description: "Descrição", price: "" }] }, ["items"], { items: [] })).toThrow("Categoria");
    expect(() => validateStructuredContent("restaurant_menu_highlights", { items: [{ category: "Pratos", title: "Prato", description: "x".repeat(501), price: "" }] }, ["items"], { items: [] })).toThrow("Descrição");

    const legacy = { items: [{ question: "", answer: "Resposta legada", rendererTag: "v1" }] };
    expect(() => validateStructuredContent("clinic_faq", legacy, ["items"], legacy)).not.toThrow();
  });

  it("exposes seed-shaped property, agent, statistics and proof fields without exposing design settings", () => {
    const content = {
      brandColor: "#123456",
      brandKit: { audience: "families" },
      stats: [{ label: "Especialidades", value: "12" }],
      properties: [{ title: "Moradia", status: "Disponível", type: "Moradia", beds: "4", baths: "3", area: "220 m²", image: "/home.jpg", imageAlt: "Moradia com jardim", ctaLabel: "Ver imóvel" }],
      items: [{ name: "Marta Costa", role: "Consultora", bio: "Acompanha famílias.", image: "/marta.jpg", imageAlt: "Marta Costa" }],
      proof: [{ label: "Conhecimento local", value: "Próximo" }],
    };

    expect(editableContentKeys(content)).not.toContain("brandColor");
    expect(editableContentKeys(content)).not.toContain("brandKit");
    expect(getContentCollections("real_estate_hero", content, ["stats", "properties", "items", "proof"]).map(({ key, fields }) => [key, fields.map(({ key: fieldKey }) => fieldKey)])).toEqual([
      ["stats", ["label", "value"]],
      ["properties", ["title", "status", "type", "beds", "baths", "area", "image", "imageAlt", "ctaLabel"]],
      ["items", ["name", "role", "bio", "image", "imageAlt"]],
      ["proof", ["label", "value"]],
    ]);
    expect(getNewCollectionItem("real_estate_hero", "stats", [])).toEqual({ label: "", value: "" });
  });

  it("keeps public clinic credentials editable without exposing authentication secrets", () => {
    const content = {
      credentials: [{ title: "Informação responsável", description: "Conteúdo factual e claro." }],
      items: [{ name: "Dra. Ana", credentials: "Ordem dos Médicos" }],
      authToken: "never editable",
      apiKey: "never editable",
    };

    expect(editableContentKeys(content)).toEqual(["credentials", "items"]);
    expect(getContentCollections("clinic_credentials", content, ["credentials"])[0].fields.map(({ key }) => key)).toEqual(["title", "description"]);
    expect(getContentCollections("clinic_doctors", content, ["items"])[0].fields.map(({ key }) => key)).toContain("credentials");
    expect(editableContentKeys({ author: "A. Pessoa" })).toEqual([]);
  });
});
