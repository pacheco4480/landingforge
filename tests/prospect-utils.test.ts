import { describe, expect, it } from "vitest";

import {
  findTemplatePlaceholders,
  buildApprovedPublicDemoUrl,
  getProspectCopyBlockReason,
  normalizeBusinessDomain,
  normalizeProspectEmail,
  normalizeSuppressionValue,
  parseCsv,
  prospectCsvHeaders,
  prospectCsvRowSchema,
  renderProspectTemplate,
  sanitizeProspectCsvPreviewRow,
} from "@/features/prospects/prospect-utils";

describe("prospect utilities", () => {
  it("normalizes professional email and website domains", () => {
    expect(normalizeProspectEmail("  Vendas@Exemplo.PT ")).toBe("vendas@exemplo.pt");
    expect(normalizeBusinessDomain("https://www.Exemplo.pt/contacto?src=x")).toBe("exemplo.pt");
    expect(normalizeBusinessDomain("javascript:alert(1)")).toBeNull();
  });

  it("normalizes suppression identifiers consistently", () => {
    expect(normalizeSuppressionValue("EMAIL", " Sales@Example.pt ")).toBe("sales@example.pt");
    expect(normalizeSuppressionValue("DOMAIN", "https://www.example.pt/path")).toBe("example.pt");
  });

  it("parses quoted CSV cells, escaped quotes and embedded newlines", () => {
    expect(parseCsv('empresa,email\n"A, B","x@y.pt"\n"Linha\nseguinte",z@y.pt')).toEqual([
      ["empresa", "email"],
      ["A, B", "x@y.pt"],
      ["Linha\nseguinte", "z@y.pt"],
    ]);
    expect(parseCsv('"A ""Boa"" Empresa",x')).toEqual([["A \"Boa\" Empresa", "x"]]);
  });

  it("rejects malformed, oversized, and unsafe imported fields", () => {
    expect(() => parseCsv('"unterminated')).toThrow("sem fecho");
    expect(() => parseCsv("a\n".repeat(503))).toThrow("500 registos");
    expect(prospectCsvRowSchema.safeParse({ businessName: "X", website: "javascript:alert(1)" }).success).toBe(false);
    expect(prospectCsvHeaders).toContain("sourceUrl");
  });

  it("sanitizes invalid CSV rows before returning preview data", () => {
    expect(sanitizeProspectCsvPreviewRow(null)).toEqual({});
    expect(sanitizeProspectCsvPreviewRow(["not", "a", "record"])).toEqual({});
    expect(sanitizeProspectCsvPreviewRow({ businessName: "Empresa", email: "a@b.pt", factualNotes: "private" })).toEqual({ businessName: "Empresa", email: "a@b.pt" });
    expect(sanitizeProspectCsvPreviewRow({ businessName: "x".repeat(200), email: "y".repeat(300) }).businessName).toHaveLength(160);
  });

  it("renders only allowlisted placeholders and detects unresolved tokens", () => {
    const message = renderProspectTemplate("Olá {{contactName}} — {{unknown}}", { contactName: "Maria" });
    expect(message).toBe("Olá Maria — {{unknown}}");
    expect(findTemplatePlaceholders(message)).toEqual(["unknown"]);
  });

  it("only builds HTTPS links for public demo origins", () => {
    expect(buildApprovedPublicDemoUrl("https://landingforge.example", "demo-x")).toBe("https://landingforge.example/templates/demo-x");
    expect(buildApprovedPublicDemoUrl("http://localhost:3000", "demo-x")).toBeNull();
    expect(buildApprovedPublicDemoUrl(undefined, "demo-x")).toBeNull();
  });

  it("blocks manual copy without source, verification, no-contact clearance, or resolved placeholders", () => {
    const valid = { status: "READY_TO_CONTACT", suppressed: false, recipient: "a@b.pt", sourceUrl: "https://b.pt", verifiedAt: new Date(), subject: "Olá", body: "Mensagem" };
    expect(getProspectCopyBlockReason(valid)).toBeNull();
    expect(getProspectCopyBlockReason({ ...valid, suppressed: true })).toContain("supressão");
    expect(getProspectCopyBlockReason({ ...valid, sourceUrl: null })).toContain("fonte pública");
    expect(getProspectCopyBlockReason({ ...valid, body: "Olá {{businessName}}" })).toContain("placeholder");
  });
});
