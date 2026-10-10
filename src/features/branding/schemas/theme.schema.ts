import { z } from "zod";

const colorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Use a valid hex color.");

export const themeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  key: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  surfaceColor: colorSchema,
  textPrimaryColor: colorSchema,
  textSecondaryColor: colorSchema,
  headingFont: z.string().trim().min(1).max(80),
  bodyFont: z.string().trim().min(1).max(80),
  borderRadius: z.string().trim().min(1).max(40),
  shadowStyle: z.string().trim().min(1).max(40),
});

export type ThemeInput = z.infer<typeof themeSchema>;
