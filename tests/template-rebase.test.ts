import { describe, expect, it } from "vitest";

import type { ProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";
import {
  applyTemplateFieldConflict,
  parseFormConflict,
  parseFormFieldConflict,
  rebaseProjectSnapshot,
} from "@/features/projects/services/template-rebase";

function snapshot(input: {
  version: string;
  sections?: ProjectSourceSnapshot["page"]["sections"];
  forms?: ProjectSourceSnapshot["page"]["forms"];
}): ProjectSourceSnapshot {
  return {
    formatVersion: 1,
    templateVersion: input.version,
    sourcePageId: `source-${input.version}`,
    templateKey: "clinic",
    variantKey: "modern",
    page: {
      title: "Clínica",
      slug: "clinica",
      theme: null,
      sections: input.sections ?? [],
      forms: input.forms ?? [],
      seoSetting: null,
    },
    capabilities: { sectionTypes: [], sections: [], forms: [] },
  };
}

function section(sectionKey: string, content: Record<string, string>, sectionType = "hero") {
  return { sectionKey, sectionType, name: sectionKey, sortOrder: 0, isVisible: true, content, settings: {} };
}

describe("project template rebase", () => {
  it("parses and applies a selected official value only at the conflicting form-field path", () => {
    const conflict = parseFormFieldConflict("formulário.contact.campo.email.validation.maxLength");
    expect(conflict).toEqual({
      formKey: "contact",
      fieldName: "email",
      propertyPath: ["validation", "maxLength"],
      replacesWholeField: false,
    });
    const resolved = applyTemplateFieldConflict(
      { name: "email", label: "Email do cliente", validation: { maxLength: 180, pattern: ".+" } },
      { name: "email", label: "Email oficial", validation: { maxLength: 120, pattern: ".+" } },
      conflict!,
    );
    expect(resolved).toEqual({ name: "email", label: "Email do cliente", validation: { maxLength: 120, pattern: ".+" } });
  });

  it("supports choosing the official field when upstream changed its type", () => {
    const conflict = parseFormFieldConflict("formulário.contact.campo.email (tipo incompatível)");
    expect(conflict?.replacesWholeField).toBe(true);
    expect(applyTemplateFieldConflict(
      { name: "email", type: "TEXT", label: "Valor do cliente" },
      { name: "email", type: "EMAIL", label: "Email oficial" },
      conflict!,
    )).toEqual({ name: "email", type: "EMAIL", label: "Email oficial" });
  });

  it("does not treat non-form conflicts as field conflicts", () => {
    expect(parseFormFieldConflict("secção.hero.content.title")).toBeNull();
    expect(parseFormConflict("formulário.contact.successMessage")).toEqual({
      formKey: "contact",
      property: "successMessage",
      replacesWholeForm: false,
    });
    expect(parseFormConflict("secção.hero.content.title")).toBeNull();
  });

  it("applies upstream defaults to untouched fields while preserving client edits and reporting conflicts", () => {
    const base = snapshot({ version: "clinic/modern@1.0.0", sections: [section("hero", { title: "Base", subtitle: "Mensagem", heroImage: "/base.jpg" })] });
    const current = snapshot({ version: "clinic/modern@1.0.0", sections: [section("hero", { title: "Texto do cliente", subtitle: "Mensagem", heroImage: "/cliente.jpg" })] });
    const incoming = snapshot({ version: "clinic/modern@1.1.0", sections: [section("hero", { title: "Novo título", subtitle: "Nova mensagem", heroImage: "/nova.jpg" })] });

    const result = rebaseProjectSnapshot(base, current, incoming);

    expect(result.snapshot.page.sections[0].content).toEqual({ title: "Texto do cliente", subtitle: "Nova mensagem", heroImage: "/cliente.jpg" });
    expect(result.report.changedSections).toContain("secção.hero");
    expect(result.report.conflicts).toContain("secção.hero.content.title");
    expect(result.report.conflicts).toContain("secção.hero.content.heroImage");
    expect(result.report.changedAssets).toContain("secção.hero.content.heroImage");
  });

  it("adds upstream sections and preserves sections removed upstream", () => {
    const base = snapshot({ version: "v1", sections: [section("hero", { title: "Base" }), section("faq", { question: "Base" }, "faq")] });
    const current = snapshot({ version: "v1", sections: [section("hero", { title: "Base" }), section("faq", { question: "Resposta do cliente" }, "faq")] });
    const incoming = snapshot({ version: "v2", sections: [section("hero", { title: "Base" }), section("new", { title: "Secção nova", imageUrl: "/nova.webp" })] });

    const result = rebaseProjectSnapshot(base, current, incoming);

    expect(result.snapshot.page.sections.map((item) => item.sectionKey)).toEqual(["hero", "new", "faq"]);
    expect(result.snapshot.page.sections.find((item) => item.sectionKey === "faq")?.content).toEqual({ question: "Resposta do cliente" });
    expect(result.report.addedSections).toContain("secção.new");
    expect(result.report.addedAssets).toContain("secção.new.content.imageUrl");
    expect(result.report.removedSectionsPreserved).toContain("secção.faq");
  });

  it("preserves customer form values and adds new template fields", () => {
    const baseForm = { key: "contact", name: "Contacto", type: "CONTACT", successMessage: "Obrigado", errorMessage: "Erro", fields: [{ name: "email", label: "Email", type: "EMAIL", placeholder: null, helpText: null, defaultValue: null, options: null, validation: null, conditionalLogic: null, sortOrder: 0, isRequired: true, isVisible: true }] };
    const base = snapshot({ version: "v1", forms: [baseForm] });
    const current = snapshot({ version: "v1", forms: [{ ...baseForm, fields: [{ ...baseForm.fields[0], label: "Email profissional" }] }] });
    const incoming = snapshot({ version: "v2", forms: [{ ...baseForm, successMessage: "Pedido recebido", fields: [{ ...baseForm.fields[0], placeholder: "nome@empresa.pt" }, { ...baseForm.fields[0], name: "phone", label: "Telefone", type: "PHONE", isRequired: false, sortOrder: 1 }] }] });

    const result = rebaseProjectSnapshot(base, current, incoming);

    expect(result.snapshot.page.forms[0].successMessage).toBe("Pedido recebido");
    expect(result.snapshot.page.forms[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "email", label: "Email profissional", placeholder: "nome@empresa.pt" }),
      expect.objectContaining({ name: "phone", label: "Telefone" }),
    ]));
    expect(result.report.addedFields).toContain("formulário.contact.campo.phone");
  });

  it("rejects a rebase across template variants", () => {
    const base = snapshot({ version: "v1" });
    const current = snapshot({ version: "v1" });
    const incoming = { ...snapshot({ version: "v2" }), variantKey: "luxury" };

    expect(() => rebaseProjectSnapshot(base, current, incoming)).toThrow("mesmo template e variante");
  });
});
