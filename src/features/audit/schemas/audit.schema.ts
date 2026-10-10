import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .catch(undefined)
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => !value || !Number.isNaN(value.getTime()), {
    message: "Invalid date.",
  });

export const auditFiltersSchema = z.object({
  action: z.string().trim().max(120).optional().catch(undefined),
  entityType: z.string().trim().max(80).optional().catch(undefined),
  search: z.string().trim().max(160).optional().catch(undefined),
  userId: z.string().uuid().optional().catch(undefined),
  from: optionalDate,
  to: optionalDate,
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;
