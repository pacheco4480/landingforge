import { z } from "zod";

import { ClientStatus } from "@/generated/prisma/client";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const optionalDate = z.union([z.iso.date(), z.literal("")]).optional();

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Indica o nome do contacto.").max(120),
  businessName: z
    .string()
    .trim()
    .min(1, "Indica o nome da empresa.")
    .max(160),
  industry: optionalText(80),
  website: optionalText(300).refine(
    (value) => !value || /^https?:\/\//i.test(value),
    "Usa um endereço completo iniciado por https:// ou http://.",
  ),
  email: z.union([z.email().max(254), z.literal("")]).optional(),
  phone: optionalText(50),
  address: optionalText(400),
  vatNumber: optionalText(40),
  internalNotes: optionalText(5000),
  lastMeaningfulContactAt: optionalDate,
  status: z.enum(ClientStatus).default(ClientStatus.LEAD),
});

export const clientIdSchema = z.object({ id: z.uuid() });

export type ClientInput = z.infer<typeof clientSchema>;
