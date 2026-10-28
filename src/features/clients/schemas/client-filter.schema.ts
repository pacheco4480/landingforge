import { z } from "zod";

import { ClientStatus } from "@/generated/prisma/client";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const clientFiltersSchema = z
  .object({
    q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
    industry: z.preprocess(
      blankToUndefined,
      z.string().trim().max(80).optional(),
    ),
    status: z.preprocess(blankToUndefined, z.enum(ClientStatus).optional()),
    from: z.preprocess(blankToUndefined, z.iso.date().optional()),
    to: z.preprocess(blankToUndefined, z.iso.date().optional()),
    page: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().min(1).max(10_000).optional(),
    ),
  })
  .superRefine((filters, context) => {
    if (filters.from && filters.to && filters.to < filters.from) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "A data final antecede a inicial.",
      });
    }
  });

export type ClientFilters = z.infer<typeof clientFiltersSchema>;

export function parseClientFilters(
  params: Record<string, string | string[] | undefined>,
) {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return clientFiltersSchema.safeParse({
    q: first(params.q),
    industry: first(params.industry),
    status: first(params.status),
    from: first(params.from),
    to: first(params.to),
    page: first(params.page),
  });
}
