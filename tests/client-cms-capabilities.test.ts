import { describe, expect, it } from "vitest";

import { capabilitiesFromPinnedSnapshot } from "@/features/exports/client-runtime/cms/capabilities";
import { clientCmsContentPatchSchema, permissionsForClientCmsRole } from "@/features/exports/client-runtime/cms/contracts";

const snapshot = {
  templateVersion: "clinic/modern@1.0.0",
  templateKey: "clinic",
  variantKey: "modern",
  page: { sections: [{ sectionKey: "hero-main", sectionType: "hero", content: { title: "Clínica" } }] },
  capabilities: { sections: [{ key: "hero-main", type: "hero", editableFields: ["title"] }] },
};

describe("client CMS capabilities", () => {
  it("only exposes fields declared by the pinned snapshot", () => {
    expect(clientCmsContentPatchSchema.safeParse({ title: "Clínica" }).success).toBe(true);
    expect(capabilitiesFromPinnedSnapshot(snapshot)).toEqual({
      templateKey: "clinic",
      variantKey: "modern",
      templateVersion: "clinic/modern@1.0.0",
      capabilities: [{ sectionKey: "hero-main", sectionType: "hero", editableFields: ["title"] }],
    });
  });

  it("rejects capability fields that do not match pinned content", () => {
    expect(() => capabilitiesFromPinnedSnapshot({
      ...snapshot,
      capabilities: { sections: [{ key: "hero-main", type: "hero", editableFields: ["title", "adminNotes"] }] },
    })).toThrow("Os campos editáveis não correspondem ao conteúdo do snapshot fixado.");
  });

  it("rejects section type drift and internal fields", () => {
    expect(() => capabilitiesFromPinnedSnapshot({
      ...snapshot,
      capabilities: { sections: [{ key: "hero-main", type: "contact", editableFields: ["title"] }] },
    })).toThrow("As capacidades não correspondem às secções da versão fixada.");
    expect(() => capabilitiesFromPinnedSnapshot({
      ...snapshot,
      page: { sections: [{ sectionKey: "hero-main", sectionType: "hero", content: { internalNotes: "x" } }] },
      capabilities: { sections: [{ key: "hero-main", type: "hero", editableFields: ["internalNotes"] }] },
    })).toThrow("O snapshot contém campos internos que não podem ser expostos no CMS.");
  });

  it("keeps the client viewer read-only", () => {
    const permissions = permissionsForClientCmsRole("viewer");
    expect(permissions.has("content.read")).toBe(true);
    expect(permissions.has("leads.read")).toBe(true);
    expect(permissions.has("content.write")).toBe(false);
    expect(permissions.has("leads.write")).toBe(false);
  });
});
