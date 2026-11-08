"use server";

import { revalidatePath } from "next/cache";

import { BackupType } from "@/generated/prisma/client";
import { createBackup } from "@/features/backups/services/backup.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export async function createManualBackupAction(_formData?: FormData) {
  void _formData;
  const user = await requirePermission(permissions.backupsCreate);
  await createBackup({ type: BackupType.MANUAL }, user.id);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
