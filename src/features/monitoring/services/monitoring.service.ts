import {
  EmailDeliveryStatus,
  SystemLogLevel,
} from "@/generated/prisma/client";
import { getDeploymentSummary } from "@/features/deployment/services/deployment.service";
import { getSecurityEventSummary } from "@/lib/security/security-event.service";
import { db } from "@/lib/db";

export async function getMonitoringWorkspace() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalErrors,
    criticalErrors,
    last24h,
    latestErrors,
    frequentErrors,
    failedEmails,
    security,
    deployment,
  ] = await Promise.all([
    db.systemErrorLog.count(),
    db.systemErrorLog.count({ where: { level: SystemLogLevel.CRITICAL } }),
    db.systemErrorLog.count({ where: { createdAt: { gte: since } } }),
    db.systemErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.systemErrorLog.groupBy({
      by: ["fingerprint", "message", "level", "source"],
      _count: { _all: true },
      orderBy: { _count: { fingerprint: "desc" } },
      take: 5,
    }),
    db.emailLog.count({ where: { status: EmailDeliveryStatus.FAILED } }),
    getSecurityEventSummary(),
    getDeploymentSummary(),
  ]);

  return {
    summary: {
      totalErrors,
      criticalErrors,
      last24h,
      failedEmails,
      securityBlocked24h: security.blocked,
    },
    latestErrors,
    frequentErrors,
    security,
    deployment,
  };
}
