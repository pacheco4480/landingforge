import { LeadStatus } from "@/generated/prisma/client";
import { z } from "zod";

export const leadSortFields = ["createdAt", "name", "status"] as const;
export const leadDateFilters = ["all", "today", "week", "month"] as const;

export const leadFiltersSchema = z.object({
  search: z.string().trim().max(120).optional().catch(undefined),
  status: z.enum(LeadStatus).optional().catch(undefined),
  date: z.enum(leadDateFilters).default("all").catch("all"),
  formId: z.uuid().optional().catch(undefined),
  source: z.string().trim().max(120).optional().catch(undefined),
  sort: z.enum(leadSortFields).default("createdAt").catch("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc").catch("desc"),
  leadId: z.uuid().optional().catch(undefined),
});

export const updateLeadStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(LeadStatus),
});

export const leadNoteSchema = z.object({
  id: z.uuid().optional(),
  leadId: z.uuid(),
  note: z.string().trim().min(2).max(2000),
});

export const deleteLeadNoteSchema = z.object({
  id: z.uuid(),
  leadId: z.uuid(),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;
