import {
  withProjectChecklistDefaults,
  type ProjectChecklistRecord,
} from "@/features/briefings/project-checklist";

type ReadinessItem = { label: string; ready: boolean };

export type ProjectReadiness = {
  content: { percent: number; completed: number; total: number; missing: string[] };
  branding: { percent: number; completed: number; total: number; missing: string[] };
};

function summarize(items: ReadinessItem[]) {
  const completed = items.filter((item) => item.ready).length;
  return {
    percent: Math.round((completed / items.length) * 100),
    completed,
    total: items.length,
    missing: items.filter((item) => !item.ready).map((item) => item.label),
  };
}

function checklistReady(
  records: ProjectChecklistRecord[],
  key: ProjectChecklistRecord["key"],
) {
  const item = records.find((record) => record.key === key);
  return item?.status === "COMPLETE" || item?.status === "NOT_APPLICABLE";
}

export function calculateProjectReadiness(
  answers: Record<string, string>,
  checklistRecords: ProjectChecklistRecord[],
): ProjectReadiness {
  const checklist = withProjectChecklistDefaults(checklistRecords);
  const hasAnswer = (key: string) => Boolean(answers[key]?.trim());

  return {
    content: summarize([
      { label: "Descrição do negócio", ready: hasAnswer("business_description") },
      { label: "Provas de confiança", ready: hasAnswer("trust_signals") },
      { label: "Conteúdos", ready: checklistReady(checklist, "CONTENT") },
      { label: "Imagens", ready: checklistReady(checklist, "IMAGES") },
    ]),
    branding: summarize([
      { label: "Logótipo", ready: checklistReady(checklist, "LOGO") },
      { label: "Materiais de marca", ready: hasAnswer("brand_assets") },
      { label: "Tom e estilo", ready: hasAnswer("voice_and_style") },
    ]),
  };
}
