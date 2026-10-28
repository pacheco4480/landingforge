import { redactSensitiveBriefingText } from "./briefing-data-safety";

export type ProjectSpecificationInput = {
  projectName: string;
  businessName: string;
  industry: string | null;
  template: string | null;
  variant: string | null;
  templateVersion: string | null;
  serviceType: string;
  deliveryMode: string;
  maintenancePlan: string;
  maintenanceScope: string | null;
  revisionVersion: number | null;
  answers: Record<string, string>;
  labels: Record<string, string>;
};

function escapeMarkdown(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/[\\`*_{}\[\]()#+.!|>~-]/g, "\\$&");
}

export function buildProjectSpecification(
  input: ProjectSpecificationInput,
  audience: "internal" | "client",
  format: "markdown" | "json",
) {
  const answers = Object.fromEntries(
    Object.entries(input.answers)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => [
        input.labels[key] ?? key,
        audience === "client"
          ? redactSensitiveBriefingText(value.trim())
          : value.trim(),
      ]),
  );
  const data =
    audience === "internal"
      ? {
          project: input.projectName,
          clientBusiness: input.businessName,
          industry: input.industry,
          template: input.template,
          variant: input.variant,
          templateVersion: input.templateVersion,
          serviceType: input.serviceType,
          deliveryMode: input.deliveryMode,
          maintenancePlan: input.maintenancePlan,
          maintenanceScope: input.maintenanceScope,
          briefingVersion: input.revisionVersion,
          answers,
        }
      : {
          project: input.projectName,
          business: input.businessName,
          industry: input.industry,
          selectedTemplate: input.template,
          selectedVariant: input.variant,
          briefingVersion: input.revisionVersion,
          answers,
        };
  if (format === "json") return JSON.stringify(data, null, 2);

  const displayAnswers = Object.entries(answers)
    .map(
      ([label, value]) =>
        `### ${escapeMarkdown(label)}\n\n${escapeMarkdown(value)}`,
    )
    .join("\n\n");
  const common = `# Especificação do projeto: ${escapeMarkdown(input.projectName)}\n\n- Empresa: ${escapeMarkdown(input.businessName)}\n- Indústria: ${input.industry ? escapeMarkdown(input.industry) : "Por definir"}\n- Template: ${input.template ? escapeMarkdown(input.template) : "Por definir"}\n- Variante: ${input.variant ? escapeMarkdown(input.variant) : "Por definir"}\n- Revisão do briefing: ${input.revisionVersion ? `v${input.revisionVersion}` : "Ainda não registada"}`;
  const internal =
    audience === "internal"
      ? `\n- Versão de origem: ${input.templateVersion ?? "Ainda não provisionada"}\n- Serviço: ${escapeMarkdown(input.serviceType)}\n- Entrega: ${escapeMarkdown(input.deliveryMode)}\n- Manutenção: ${escapeMarkdown(input.maintenancePlan)}\n- Âmbito de manutenção: ${input.maintenanceScope ? escapeMarkdown(input.maintenanceScope) : "Não definido"}`
      : "";
  return `${common}${internal}\n\n## Briefing consolidado\n\n${displayAnswers || "Ainda sem respostas."}\n`;
}
