import { DemoStatus, PageStatus } from "@/generated/prisma/client";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const demoCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: slugSchema,
  demoKey: slugSchema,
  templateId: z.string().uuid().optional().or(z.literal("")),
  templateVariantId: z.string().uuid().optional().or(z.literal("")),
  themeId: z.string().uuid().optional().or(z.literal("")),
});

export const demoSettingsSchema = demoCreateSchema.extend({
  id: z.string().uuid(),
  demoStatus: z.enum(DemoStatus),
  pageStatus: z.enum(PageStatus),
  portfolioVisible: z.coerce.boolean().default(false),
  portfolioOrder: z.coerce.number().int().optional().or(z.literal("")),
});

export const demoFilterSchema = z.object({
  search: z.string().trim().optional().catch(undefined),
  status: z.enum(DemoStatus).optional().catch(undefined),
  industryId: z.string().uuid().optional().catch(undefined),
  templateId: z.string().uuid().optional().catch(undefined),
  templateVariantId: z.string().uuid().optional().catch(undefined),
});

export const demoIdSchema = z.object({ id: z.string().uuid() });
