import { db } from "@/lib/db";
import { getDigestOverview } from "@/features/email/services/digest-scheduler.service";
import { getRecentAuditActivity } from "@/features/audit/services/audit.service";
import { getBackupSummary } from "@/features/backups/services/backup.service";
import { getDeploymentSummary } from "@/features/deployment/services/deployment.service";
import { getSecurityEventSummary } from "@/lib/security/security-event.service";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getDashboardMetrics(userId: string) {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);

  const [
    totalLeads,
    leadsToday,
    leadsThisWeek,
    leadsThisMonth,
    totalPages,
    latestLead,
    latestPage,
    unreadNotifications,
    notificationOverview,
    securitySummary,
    backupSummary,
    deploymentSummary,
    recentAuditActivity,
  ] = await Promise.all([
    db.lead.count({ where: { deletedAt: null } }),
    db.lead.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
    db.lead.count({ where: { deletedAt: null, createdAt: { gte: week } } }),
    db.lead.count({ where: { deletedAt: null, createdAt: { gte: month } } }),
    db.page.count({ where: { deletedAt: null } }),
    db.lead.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    db.page.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    db.notification.count({ where: { userId, isRead: false } }),
    getDigestOverview(),
    getSecurityEventSummary(),
    getBackupSummary(),
    getDeploymentSummary(),
    getRecentAuditActivity(5),
  ]);

  const lastUpdatedAt =
    [latestLead?.updatedAt, latestPage?.updatedAt]
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    totalLeads,
    leadsToday,
    leadsThisWeek,
    leadsThisMonth,
    totalPages,
    lastUpdatedAt,
    systemStatus: "Operational" as const,
    unreadNotifications,
    notificationOverview,
    securitySummary,
    backupSummary,
    deploymentSummary,
    recentAuditActivity,
  };
}
