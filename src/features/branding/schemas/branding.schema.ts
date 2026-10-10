import { z } from "zod";

const colorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Use a valid hex color.");

export const brandingSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  siteName: z.string().trim().min(1).max(120),
  businessType: z.string().trim().min(1).max(80),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  whatsappUrl: z.string().trim().url().optional().or(z.literal("")),
  facebookUrl: z.string().trim().url().optional().or(z.literal("")),
  instagramUrl: z.string().trim().url().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
});

export type BrandingInput = z.infer<typeof brandingSchema>;
