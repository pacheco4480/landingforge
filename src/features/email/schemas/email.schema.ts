import { EmailDigestFrequency } from "@/generated/prisma/client";
import { z } from "zod";

export const notificationSettingsSchema = z.object({
  frequency: z.enum(EmailDigestFrequency),
  hour: z.coerce.number().int().min(0).max(23),
  weekday: z.coerce.number().int().min(0).max(6),
  timezone: z.literal("Europe/Lisbon"),
  recipient: z.string().trim().email().optional().or(z.literal("")),
});

export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
