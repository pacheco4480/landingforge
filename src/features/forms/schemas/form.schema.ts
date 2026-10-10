import { FormStatus, FormType } from "@/generated/prisma/client";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => !value || value.startsWith("/") || /^https?:\/\//.test(value),
    {
      message: "Use a site path or valid URL.",
    },
  );

export const formSchema = z.object({
  id: z.string().uuid().optional(),
  pageId: z.string().uuid().optional().or(z.literal("")),
  thankYouPageId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(120),
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(FormType),
  status: z.enum(FormStatus),
  description: z.string().trim().max(300).optional(),
  successMessage: z.string().trim().min(1).max(240),
  errorMessage: z.string().trim().min(1).max(240),
  recipientEmail: z.string().trim().email(),
  redirectUrl: optionalUrl,
  gdprConsentRequired: z.coerce.boolean().default(false),
  gdprConsentLabel: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .default("Li e aceito a Politica de Privacidade."),
  gdprConsentVersion: z.string().trim().min(1).max(40).default("1.0"),
});

export type FormInput = z.infer<typeof formSchema>;

export const formCreateSchema = formSchema.omit({ id: true });
