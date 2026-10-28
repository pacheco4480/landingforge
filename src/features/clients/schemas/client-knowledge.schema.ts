import { z } from "zod";

import { ClientKnowledgeCategory } from "@/generated/prisma/client";

const optionalProjectId = z.union([z.uuid(), z.literal("")]);

export const clientKnowledgeEntrySchema = z.object({
  clientId: z.uuid(),
  projectId: optionalProjectId,
  category: z.enum(ClientKnowledgeCategory),
  title: z.string().trim().min(1, "Indica um título.").max(160),
  content: z.string().trim().min(1, "Indica o conteúdo.").max(3000),
});

export const clientKnowledgeEntryIdSchema = z.object({
  id: z.uuid(),
  clientId: z.uuid(),
});

export type ClientKnowledgeEntryInput = z.infer<typeof clientKnowledgeEntrySchema>;
