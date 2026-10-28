import { z } from "zod";

import { ProjectStatus } from "@/generated/prisma/client";

const blankToUndefined = (value: unknown) => value === "" ? undefined : value;

export const projectFiltersSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  industry: z.preprocess(blankToUndefined, z.uuid().optional()),
  status: z.preprocess(blankToUndefined, z.enum(ProjectStatus).optional()),
  from: z.preprocess(blankToUndefined, z.iso.date().optional()),
  to: z.preprocess(blankToUndefined, z.iso.date().optional()),
}).superRefine((filters, context) => {
  if (filters.from && filters.to && filters.to < filters.from) {
    context.addIssue({ code: "custom", path: ["to"], message: "A data final antecede a inicial." });
  }
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

export function parseProjectFilters(
  params: Record<string, string | string[] | undefined>,
) {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return projectFiltersSchema.safeParse({
    q: first(params.q),
    industry: first(params.industry),
    status: first(params.status),
    from: first(params.from),
    to: first(params.to),
  });
}
