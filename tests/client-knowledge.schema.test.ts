import { describe, expect, it } from "vitest";

import { clientKnowledgeEntrySchema } from "@/features/clients/schemas/client-knowledge.schema";

describe("client knowledge entry schema", () => {
  it("accepts a note scoped to a client and one of its projects", () => {
    const result = clientKnowledgeEntrySchema.safeParse({
      clientId: "e93aa4d6-0db9-463b-a34a-a1f40d5339d2",
      projectId: "c6168ab7-a280-4874-b82a-13f9e65d3f97",
      category: "APPROVED_STYLE",
      title: "Direção visual aprovada",
      content: "Fotografia editorial com luz natural.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty and oversized free-text fields", () => {
    expect(clientKnowledgeEntrySchema.safeParse({
      clientId: "e93aa4d6-0db9-463b-a34a-a1f40d5339d2",
      projectId: "",
      category: "PREFERENCE",
      title: " ",
      content: "Nota",
    }).success).toBe(false);
    expect(clientKnowledgeEntrySchema.safeParse({
      clientId: "e93aa4d6-0db9-463b-a34a-a1f40d5339d2",
      projectId: "",
      category: "PREFERENCE",
      title: "Preferência",
      content: "x".repeat(3001),
    }).success).toBe(false);
  });
});
