import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return value.startsWith("/");
      }
    },
    { message: "Use a valid absolute URL or site path." },
  );

const optionalJsonSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) return undefined;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        context.addIssue({
          code: "custom",
          message: "Structured data must be a JSON object.",
        });
        return z.NEVER;
      }
      return parsed;
    } catch {
      context.addIssue({
        code: "custom",
        message: "Structured data must be valid JSON.",
      });
      return z.NEVER;
    }
  });

export const seoSettingSchema = z.object({
  pageId: z.string().uuid(),
  metaTitle: z.string().trim().min(30).max(60),
  metaDescription: z.string().trim().min(120).max(160),
  keywords: z.string().trim().max(240).optional(),
  canonicalUrl: optionalUrlSchema,
  ogTitle: z.string().trim().max(80).optional(),
  ogDescription: z.string().trim().max(200).optional(),
  ogImageMediaId: z.string().uuid().optional().or(z.literal("")),
  twitterCardType: z
    .enum(["summary", "summary_large_image"])
    .default("summary_large_image"),
  robotsIndex: z.coerce.boolean(),
  robotsFollow: z.coerce.boolean(),
  schemaJson: optionalJsonSchema,
});

export type SeoSettingInput = z.infer<typeof seoSettingSchema>;

export const seoPageQuerySchema = z.object({
  pageId: z.string().uuid().optional(),
});
