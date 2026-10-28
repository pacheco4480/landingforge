import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { buildProjectSpecificationPdf } from "@/features/briefings/project-specification-pdf";

describe("project specification PDF", () => {
  it("creates a readable multi-page PDF and preserves Portuguese text", async () => {
    const content = [
      "# Especificação do projeto: Clínica São João",
      "",
      "## Briefing consolidado",
      "",
      "### Comunicação e acessibilidade",
      "A clínica oferece avaliação, acompanhamento e informação clara em português de Portugal.",
      "",
      ...Array.from(
        { length: 180 },
        (_, index) =>
          `### Serviço ${index + 1}\n\nDescrição detalhada com informação sobre marcação, preparação e acompanhamento do cliente.`,
      ),
    ].join("\n");

    const bytes = await buildProjectSpecificationPdf(content);
    const document = await PDFDocument.load(bytes);

    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getTitle()).toBe("Especificação do projeto LandingForge");
  });

  it("rejects oversized specifications instead of truncating them", async () => {
    await expect(
      buildProjectSpecificationPdf("x".repeat(180_001)),
    ).rejects.toThrow("excede o limite para exportação PDF");
  });
});
