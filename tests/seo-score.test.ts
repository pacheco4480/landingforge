import { describe, expect, it } from "vitest";

import { getSeoChecks, getSeoScore } from "@/features/seo/services/seo-score.service";

describe("seo score", () => {
  it("scores complete SEO data higher than incomplete data", () => {
    const complete = getSeoScore({
      metaTitle: "Premium Restaurant Landing Page for Local Reservations",
      metaDescription:
        "Create a high-performing restaurant landing page with local SEO, social previews, structured data and clear reservation conversion paths.",
      canonicalUrl: "https://example.com",
      ogImageUrl: "https://example.com/image.jpg",
      robotsIndex: true,
      robotsFollow: true,
      schemaJson: { "@type": "Restaurant" },
      missingAltTextCount: 0,
    });

    const incomplete = getSeoScore({
      metaTitle: "Short",
      metaDescription: "Short",
      robotsIndex: false,
      robotsFollow: false,
      missingAltTextCount: 2,
    });

    expect(complete).toBeGreaterThan(incomplete);
  });

  it("uses Portuguese user-facing labels and guidance", () => {
    const checks = getSeoChecks({
      robotsIndex: true,
      robotsFollow: true,
      missingAltTextCount: 1,
    });

    expect(checks.map(({ label }) => label)).toEqual([
      "Título SEO",
      "Descrição SEO",
      "URL canónico",
      "Imagem para partilha",
      "Indexação e seguimento",
      "Dados estruturados",
      "Texto alternativo das imagens",
    ]);
    expect(checks.every(({ message }) => /[áéíóúãõç]|\b(Usa|Define|Seleciona|Recomenda-se|Gera|Adiciona)\b/i.test(message))).toBe(true);
  });
});
