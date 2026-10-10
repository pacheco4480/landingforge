import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const localSeoSchema = z.object({
  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),
  postalCode: optionalText(40),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  openingHours: optionalText(600),
});

export type LocalSeoInput = z.infer<typeof localSeoSchema>;
