import { z } from "zod";

export const cookieConsentSchema = z.object({
  consentId: z.string().trim().min(8).max(120),
  version: z.string().trim().min(1).max(40),
  necessary: z.coerce.boolean().default(true),
  analytics: z.coerce.boolean().default(false),
  marketing: z.coerce.boolean().default(false),
});

export const legalSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  consentVersion: z.string().trim().min(1).max(40),
  cookieBannerEnabled: z.coerce.boolean().default(false),
  analyticsCookiesEnabled: z.coerce.boolean().default(false),
  marketingCookiesEnabled: z.coerce.boolean().default(false),
  privacyPageId: z.string().uuid().optional().or(z.literal("")),
  cookiePageId: z.string().uuid().optional().or(z.literal("")),
  termsPageId: z.string().uuid().optional().or(z.literal("")),
  retentionDays: z.coerce.number().int().min(30).max(3650),
  dataControllerName: z.string().trim().max(160).optional(),
  dataControllerEmail: z.string().trim().email().optional().or(z.literal("")),
});

export const personalDataExportSchema = z.object({
  email: z.string().trim().email(),
});

export type CookieConsentInput = z.infer<typeof cookieConsentSchema>;
export type LegalSettingsInput = z.infer<typeof legalSettingsSchema>;
