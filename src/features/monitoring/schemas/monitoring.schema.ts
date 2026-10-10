import { z } from "zod";

import { SystemLogLevel, SystemLogSource } from "@/generated/prisma/client";

export const monitoringLogSchema = z.object({
  level: z.enum(SystemLogLevel),
  source: z.enum(SystemLogSource),
  message: z.string().trim().min(1).max(600),
  userId: z.uuid().nullable().optional(),
  path: z.string().trim().max(300).nullable().optional(),
  action: z.string().trim().max(120).nullable().optional(),
  requestId: z.string().trim().max(120).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
