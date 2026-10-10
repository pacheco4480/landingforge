import { z } from "zod";

import { sectionTypes } from "@/features/content/section-types";

export const sectionContentSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (content) => Object.keys(content).length > 0,
    "Section content is required.",
  );

export const sectionCreateSchema = z.object({
  pageId: z.string().uuid(),
  sectionType: z.enum(sectionTypes),
  name: z.string().trim().min(1, "Section name is required.").max(80),
});

export const sectionUpdateSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  name: z.string().trim().min(1, "Section name is required.").max(80),
  sectionType: z.enum(sectionTypes),
  content: sectionContentSchema,
  settings: z.record(z.string(), z.unknown()).default({}),
});

export const sectionActionSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
});

export type SectionCreateInput = z.infer<typeof sectionCreateSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
