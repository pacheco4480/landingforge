import { z } from "zod";

export const portfolioFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  industry: z.string().trim().max(80).optional().catch(undefined),
  template: z.string().uuid().optional().catch(undefined),
  variant: z.string().uuid().optional().catch(undefined),
});

export const portfolioScreenshotSchema = z.object({
  pageId: z.string().uuid(),
  mediaAssetId: z.string().uuid().optional().or(z.literal("")),
  category: z.enum(["hero", "section", "form", "cms", "dashboard"]),
  viewport: z.enum(["desktop", "tablet", "mobile", "cms"]),
  sourceRoute: z.string().trim().min(1).max(180),
  consentState: z.enum(["accepted", "rejected", "not-applicable"]),
  contentOrigin: z.enum(["fictional-demo", "client-approved", "other"]),
  altText: z.string().trim().min(5).max(240),
  isPublic: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  capturedAt: z.string().datetime().optional().or(z.literal("")),
});

export const portfolioScreenshotIdSchema = z.object({ id: z.string().uuid() });

export const portfolioVisibilitySchema = z.object({
  pageId: z.string().uuid(),
  isPublic: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999).nullable(),
});
