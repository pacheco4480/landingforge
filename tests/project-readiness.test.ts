import { describe, expect, it } from "vitest";

import { calculateProjectReadiness } from "@/features/briefings/project-readiness";

describe("project readiness indicators", () => {
  it("starts at zero and lists missing operational requirements", () => {
    const scores = calculateProjectReadiness({}, []);

    expect(scores.content).toEqual({
      percent: 0,
      completed: 0,
      total: 4,
      missing: ["Descrição do negócio", "Provas de confiança", "Conteúdos", "Imagens"],
    });
    expect(scores.branding).toMatchObject({
      percent: 0,
      completed: 0,
      total: 3,
      missing: ["Logótipo", "Materiais de marca", "Tom e estilo"],
    });
  });

  it("counts explicit answers and complete or not-applicable checklist states", () => {
    const scores = calculateProjectReadiness(
      {
        business_description: "Serviços profissionais",
        trust_signals: "Certificação válida",
        brand_assets: "Guia de marca entregue",
        voice_and_style: "Claro e próximo",
      },
      [
        { key: "CONTENT", status: "COMPLETE", note: null, reference: null },
        { key: "IMAGES", status: "IN_PROGRESS", note: null, reference: null },
        { key: "LOGO", status: "NOT_APPLICABLE", note: null, reference: null },
      ],
    );

    expect(scores.content).toMatchObject({ percent: 75, completed: 3, total: 4, missing: ["Imagens"] });
    expect(scores.branding).toMatchObject({ percent: 100, completed: 3, total: 3, missing: [] });
  });

  it("does not count whitespace-only answers as complete", () => {
    const scores = calculateProjectReadiness({ brand_assets: "  " }, []);
    expect(scores.branding.completed).toBe(0);
  });
});
