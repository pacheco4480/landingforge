import { z } from "zod";

export const securitySettingsSchema = z.object({
  turnstileEnabled: z.coerce.boolean().default(false),
  turnstileSiteKey: z.string().trim().max(200).optional().or(z.literal("")),
  honeypotEnabled: z.coerce.boolean().default(true),
  duplicateCooldownSeconds: z.coerce.number().int().min(10).max(3600),
  loginLimitPerMinute: z.coerce.number().int().min(1).max(60),
  passwordResetLimitPerHour: z.coerce.number().int().min(1).max(30),
  formLimitPerMinute: z.coerce.number().int().min(1).max(60),
  uploadLimitPerMinute: z.coerce.number().int().min(1).max(120),
  apiLimitPerMinute: z.coerce.number().int().min(10).max(600),
});
