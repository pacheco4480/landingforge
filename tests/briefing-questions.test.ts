import { describe, expect, it } from "vitest";

import {
  briefingCompletion,
  getBriefingQuestions,
  sectionCapabilitiesFromSnapshot,
  sectionFieldAnswerKey,
  sectionFieldAnswers,
  validateBriefingAnswers,
} from "@/features/briefings/briefing-questions";
import { buildProjectSpecification } from "@/features/briefings/project-specification";
import { redactSensitiveBriefingText } from "@/features/briefings/briefing-data-safety";

const snapshot = {
  page: {
    sections: [
      {
        sectionKey: "hero.main",
        name: "Hero",
        isVisible: true,
        content: { headline: "Demo", paragraphs: ["a", "b"], subtitle: null },
      },
      {
        sectionKey: "hidden",
        name: "Secção oculta",
        isVisible: false,
        content: { headline: "Não perguntar" },
      },
    ],
  },
  capabilities: {
    sections: [
      {
        key: "hero.main",
        editableFields: ["headline", "paragraphs", "subtitle", "unknown"],
      },
      { key: "hidden", editableFields: ["headline"] },
      { key: "missing", editableFields: ["headline"] },
    ],
  },
};

describe("briefing questions", () => {
  it("combines common, industry and only visible text fields from the pinned snapshot", () => {
    const capabilities = sectionCapabilitiesFromSnapshot(snapshot);
    expect(capabilities).toEqual([
      {
        key: "hero.main",
        name: "Hero",
        editableFields: ["headline", "subtitle"],
      },
    ]);
    const questions = getBriefingQuestions("real_estate", capabilities);
    expect(questions.some(({ key }) => key === "property_services")).toBe(true);
    expect(
      questions.some(
        ({ key }) => key === sectionFieldAnswerKey("hero.main", "headline"),
      ),
    ).toBe(true);
    expect(questions.some(({ key }) => key.includes("paragraphs"))).toBe(false);
    expect(questions.some(({ group }) => group === "Secção oculta")).toBe(
      false,
    );
  });

  it("rejects unlisted answers, non-string values, long answers and unsupported select values", () => {
    expect(() =>
      validateBriefingAnswers({ injected_question: "x" }, "clinic"),
    ).toThrow("O briefing contém uma resposta não permitida.");
    expect(() =>
      validateBriefingAnswers(
        { business_description: { html: "bad" } },
        "clinic",
      ),
    ).toThrow("O briefing contém uma resposta não permitida.");
    expect(() =>
      validateBriefingAnswers(
        { business_description: "x".repeat(3001) },
        "clinic",
      ),
    ).toThrow("excede o limite permitido");
    expect(() =>
      validateBriefingAnswers({ business_goal: "Dados de cartão" }),
    ).toThrow("não pertence às opções disponíveis");
  });

  it("normalizes section field keys and calculates progress against the active questionnaire", () => {
    const key = sectionFieldAnswerKey("hero:primary", "headline.title");
    expect(sectionFieldAnswers({ [key]: "Título" })).toEqual([
      { sectionKey: "hero:primary", field: "headline.title", value: "Título" },
    ]);
    expect(sectionFieldAnswers({ "section:%ZZ:field": "x" })).toEqual([]);
    expect(
      briefingCompletion({ business_description: "Marca" }, "clinic"),
    ).toMatchObject({ completed: 1, total: 15, percent: 7 });
  });

  it("keeps internal operations out of the client specification and encodes JSON safely", () => {
    const input = {
      projectName: "Projeto Demo",
      businessName: "Empresa Exemplo",
      industry: "Clínica",
      template: "Clinic",
      variant: "Modern",
      templateVersion: "clinic/modern@1.0.0",
      serviceType: "TEMPLATE_ADAPTATION",
      deliveryMode: "LANDING_ONLY",
      maintenancePlan: "NONE",
      maintenanceScope: "Apenas alterações contratadas",
      revisionVersion: 2,
      answers: { business_description: "Descrição *com prova*" },
      labels: { business_description: "Descrição do negócio" },
    };
    const client = buildProjectSpecification(input, "client", "json");
    expect(client).not.toContain("maintenanceScope");
    expect(client).not.toContain("serviceType");
    expect(JSON.parse(client)).toMatchObject({
      project: "Projeto Demo",
      briefingVersion: 2,
    });
    expect(buildProjectSpecification(input, "internal", "markdown")).toContain(
      "Âmbito de manutenção",
    );
  });

  it("redacts obvious contact details, credentials and explicit clinical phrases", () => {
    const result = redactSensitiveBriefingText(
      "email ana@example.pt, telefone +351 912 345 678, password=abc123; histórico clínico do paciente",
    );
    expect(result).toContain("[EMAIL REDIGIDO]");
    expect(result).toContain("[TELEFONE REDIGIDO]");
    expect(result).toContain("[CREDENCIAL REDIGIDA]");
    expect(result).toContain("[DADO DE SAÚDE OMITIDO]");
  });
});
