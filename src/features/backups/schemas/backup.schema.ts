import { BackupType } from "@/generated/prisma/client";
import { z } from "zod";

export const backupCreateSchema = z.object({
  type: z.enum(BackupType).default(BackupType.MANUAL),
});

export type BackupCreateInput = z.infer<typeof backupCreateSchema>;
