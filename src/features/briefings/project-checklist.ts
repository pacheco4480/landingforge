export const projectChecklistItems = [
  { key: "LOGO", label: "Logótipo" },
  { key: "CONTENT", label: "Conteúdos" },
  { key: "IMAGES", label: "Imagens" },
  { key: "DOMAIN", label: "Domínio" },
  { key: "HOSTING", label: "Alojamento" },
  { key: "APPROVAL", label: "Aprovação" },
  { key: "PAYMENT", label: "Pagamento" },
] as const;

export type ProjectChecklistKey = (typeof projectChecklistItems)[number]["key"];
export type ProjectChecklistStatus =
  | "MISSING"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "NOT_APPLICABLE";

export type ProjectChecklistRecord = {
  key: ProjectChecklistKey;
  status: ProjectChecklistStatus;
  note: string | null;
  reference: string | null;
};

export function withProjectChecklistDefaults(
  records: ProjectChecklistRecord[],
): ProjectChecklistRecord[] {
  const byKey = new Map(records.map((record) => [record.key, record]));
  return projectChecklistItems.map(
    ({ key }) =>
      byKey.get(key) ?? {
        key,
        status: "MISSING",
        note: null,
        reference: null,
      },
  );
}

export function projectChecklistProgress(records: ProjectChecklistRecord[]) {
  const checklist = withProjectChecklistDefaults(records);
  const complete = checklist.filter(
    ({ status }) => status === "COMPLETE" || status === "NOT_APPLICABLE",
  ).length;
  return {
    complete,
    total: projectChecklistItems.length,
    percent: Math.round((complete / projectChecklistItems.length) * 100),
  };
}
