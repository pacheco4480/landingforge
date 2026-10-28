import { z } from "zod";

import {
  MaintenancePlan,
  ProjectDeliveryMode,
  ProjectParty,
  ProjectPriority,
  ProjectServiceType,
  ProjectStatus,
} from "@/generated/prisma/client";

const optionalId = z.union([z.uuid(), z.literal("")]).optional();
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const optionalDate = z
  .union([z.iso.date(), z.literal("")])
  .optional();

export const projectSchema = z
  .object({
    clientId: z.uuid(),
    name: z.string().trim().min(1, "Indica o nome do projeto.").max(160),
    serviceType: z.enum(ProjectServiceType),
    status: z.enum(ProjectStatus),
    priority: z.enum(ProjectPriority),
    industryId: optionalId,
    templateId: optionalId,
    templateVariantId: optionalId,
    deliveryMode: z.enum(ProjectDeliveryMode),
    siteManagementOwner: z.enum(ProjectParty),
    hostingOwner: z.enum(ProjectParty),
    domainOwner: z.enum(ProjectParty),
    contentOwner: z.enum(ProjectParty),
    publishingOwner: z.enum(ProjectParty),
    maintenancePlan: z.enum(MaintenancePlan),
    maintenanceScope: optionalText(3000),
    maintenanceChannel: optionalText(200),
    maintenanceWindow: optionalText(200),
    startDate: optionalDate,
    deliveryDate: optionalDate,
    serviceEndedAt: optionalDate,
    assigneeIds: z.array(z.uuid()).max(15).default([]),
  })
  .superRefine((project, context) => {
    if (
      project.startDate &&
      project.deliveryDate &&
      project.deliveryDate < project.startDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["deliveryDate"],
        message: "A data de entrega não pode anteceder o início.",
      });
    }

    if (project.serviceEndedAt && project.status !== ProjectStatus.DELIVERED && project.status !== ProjectStatus.ARCHIVED) {
      context.addIssue({
        code: "custom",
        path: ["serviceEndedAt"],
        message: "Regista o fim do serviço apenas quando o projeto estiver entregue ou arquivado.",
      });
    }

    if (project.templateVariantId && !project.templateId) {
      context.addIssue({
        code: "custom",
        path: ["templateVariantId"],
        message: "Seleciona primeiro o template associado à variante.",
      });
    }

    if (
      project.maintenancePlan === MaintenancePlan.NONE &&
      (project.maintenanceScope || project.maintenanceChannel || project.maintenanceWindow)
    ) {
      context.addIssue({
        code: "custom",
        path: ["maintenancePlan"],
        message: "Define um plano de manutenção antes de preencher o respetivo âmbito.",
      });
    }
  });

export const projectIdSchema = z.object({ id: z.uuid() });

export type ProjectInput = z.infer<typeof projectSchema>;
