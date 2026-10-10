import { z } from "zod";

import { PageStatus, PageType } from "@/generated/prisma/client";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(120, "Slug must be 120 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens.",
  );

export const pageCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  slug: slugSchema,
  status: z.enum(PageStatus).default(PageStatus.DRAFT),
  pageType: z.enum(PageType).default(PageType.LANDING),
  templateId: z.string().uuid().optional().or(z.literal("")),
  templateVariantId: z.string().uuid().optional().or(z.literal("")),
});

export const pageUpdateSchema = pageCreateSchema.extend({
  id: z.string().uuid(),
});

export const pageIdSchema = z.object({
  id: z.string().uuid(),
});

export type PageCreateInput = z.infer<typeof pageCreateSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
