import { ProspectSourceType, ProspectStatus, ProspectSuppressionType } from "@/generated/prisma/client";
import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = (max: number) => z.union([z.url().max(max).refine((value) => /^https?:\/\//i.test(value)), z.literal("")]).optional();

export const prospectSchema = z.object({
  id: z.uuid().optional(),
  businessName: z.string().trim().min(1, "Indica o nome da empresa.").max(160),
  contactName: optionalText(120),
  email: z.union([z.email().max(254), z.literal("")]).optional(),
  phone: optionalText(50),
  industry: optionalText(80),
  locality: optionalText(120),
  website: optionalUrl(500),
  publicProfileUrl: optionalUrl(500),
  sourceUrl: optionalUrl(1000),
  collectedAt: z.iso.datetime().optional(),
  verifiedAt: z.union([z.iso.date(), z.literal("")]).optional(),
  lastMeaningfulContactAt: z.union([z.iso.date(), z.literal("")]).optional(),
  businessSignals: z.array(z.enum(["Sem website", "Website desatualizado", "Website não adaptado a mobile", "Falta de formulário claro", "Presença local relevante"])).max(5).default([]),
  factualNotes: optionalText(3000),
  qualificationReason: optionalText(1000),
  nextFollowUpAt: z.union([z.iso.date(), z.literal("")]).optional(),
  status: z.enum(ProspectStatus).default(ProspectStatus.NEW),
});

export const prospectFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(80).optional(),
  locality: z.string().trim().max(120).optional(),
  signal: z.enum(["Sem website", "Website desatualizado", "Website não adaptado a mobile", "Falta de formulário claro", "Presença local relevante"]).optional(),
  status: z.enum(ProspectStatus).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
});

export const prospectSuppressionSchema = z.object({
  type: z.enum(ProspectSuppressionType),
  value: z.string().trim().min(1).max(254),
  reason: z.string().trim().min(2).max(300),
}).superRefine((data, context) => {
  const value = data.value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/:?#]/)[0] ?? "";
  const valid = data.type === ProspectSuppressionType.EMAIL
    ? z.email().safeParse(data.value).success
    : /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
  if (!valid) context.addIssue({ code: "custom", path: ["value"], message: "Indica um email válido ou um domínio empresarial válido." });
});

export const prospectEmailTemplateSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  industry: optionalText(80),
  purpose: z.string().trim().min(1).max(300),
  locale: z.literal("pt-PT").default("pt-PT"),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(12000),
});

export const prospectDraftSchema = z.object({
  prospectId: z.uuid(),
  templateId: z.uuid().optional().or(z.literal("")),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(12000),
  publicDemoSlug: z.string().trim().max(160).optional().or(z.literal("")),
});

export const prospectIdSchema = z.object({ id: z.uuid() });
export const prospectStatusSchema = z.object({ id: z.uuid(), status: z.enum(ProspectStatus) });
export const prospectSourceTypeSchema = z.enum(ProspectSourceType);

export type ProspectInput = z.infer<typeof prospectSchema>;
