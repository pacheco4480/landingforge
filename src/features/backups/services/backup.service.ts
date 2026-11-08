import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { BackupStatus, BackupType, Prisma } from "@/generated/prisma/client";
import { backupCreateSchema } from "@/features/backups/schemas/backup.schema";
import { db } from "@/lib/db";

const backupDir = path.join(process.cwd(), ".landingforge", "backups");

export async function getBackupWorkspace() {
  const [backups, summary] = await Promise.all([
    db.backup.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { createdByUser: { select: { name: true, email: true } } },
    }),
    getBackupSummary(),
  ]);

  return { backups, summary };
}

export async function getBackupSummary() {
  const [lastBackup, failedBackups, totalBackups] = await Promise.all([
    db.backup.findFirst({ orderBy: { createdAt: "desc" } }),
    db.backup.count({ where: { status: BackupStatus.FAILED } }),
    db.backup.count(),
  ]);

  return { failedBackups, lastBackup, totalBackups };
}

export async function createBackup(input: unknown, userId?: string) {
  const data = backupCreateSchema.parse(input);
  const backup = await db.backup.create({
    data: {
      type: data.type,
      status: BackupStatus.PENDING,
      createdByUserId: userId,
    },
  });

  try {
    await mkdir(backupDir, { recursive: true });
    const payload = await createBackupPayload();
    const storagePath = path.join(
      backupDir,
      `landingforge-${backup.id}-${Date.now()}.json`,
    );
    await writeFile(storagePath, JSON.stringify(payload, null, 2), "utf8");
    const file = await stat(storagePath);
    const completed = await db.backup.update({
      where: { id: backup.id },
      data: {
        status: BackupStatus.COMPLETED,
        storagePath,
        sizeBytes: file.size,
        completedAt: new Date(),
      },
    });
    await recordBackupAudit(userId, "backup.create", completed.id, {
      status: completed.status,
      sizeBytes: completed.sizeBytes,
      type: completed.type,
    });
    return completed;
  } catch (error) {
    const failed = await db.backup.update({
      where: { id: backup.id },
      data: {
        status: BackupStatus.FAILED,
        completedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message.slice(0, 500) : "Backup failed.",
      },
    });
    await recordBackupAudit(userId, "backup.failed", failed.id, {
      status: failed.status,
      errorMessage: failed.errorMessage,
      type: failed.type,
    });
    throw error;
  }
}

export async function createAutomaticBackup() {
  const latest = await db.backup.findFirst({
    where: { type: BackupType.AUTOMATIC, status: BackupStatus.COMPLETED },
    orderBy: { createdAt: "desc" },
  });
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (latest && latest.createdAt.getTime() > oneDayAgo) {
    return { skipped: true, backup: latest };
  }
  const backup = await createBackup({ type: BackupType.AUTOMATIC });
  return { skipped: false, backup };
}

async function createBackupPayload() {
  const [
    siteSettings,
    clientSettings,
    securitySettings,
    legalSettings,
    cookieConsents,
    pages,
    forms,
    formSubmissions,
    leads,
    mediaAssets,
    seoSettings,
    redirects,
    auditLogs,
  ] = await Promise.all([
    db.siteSetting.findMany(),
    db.clientSetting.findMany(),
    db.securitySetting.findMany(),
    db.legalSetting.findMany(),
    db.cookieConsent.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    db.page.findMany({
      where: { deletedAt: null },
      include: { sections: true, template: true, templateVariant: true, theme: true },
    }),
    db.form.findMany({
      where: { deletedAt: null },
      include: { fields: true },
    }),
    db.formSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    db.lead.findMany({
      where: { deletedAt: null },
      include: { notes: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    db.mediaAsset.findMany({ where: { deletedAt: null } }),
    db.seoSetting.findMany(),
    db.redirect.findMany(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    version: 1,
    note: "Logical backup. Restore UI is intentionally out of scope for TASK 017.",
    data: {
      auditLogs,
      clientSettings,
      cookieConsents,
      forms,
      formSubmissions,
      leads,
      legalSettings,
      mediaAssets,
      pages,
      redirects,
      securitySettings,
      seoSettings,
      siteSettings,
    },
  };
}

async function recordBackupAudit(
  userId: string | undefined,
  action: string,
  entityId: string,
  values: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "backup",
      entityId,
      newValues: values as Prisma.InputJsonValue,
    },
  });
}
