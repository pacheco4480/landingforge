import { AuditFilterBar } from "@/features/audit/components/audit-filter-bar";
import { AuditSummaryCards } from "@/features/audit/components/audit-summary-cards";
import { AuditTable } from "@/features/audit/components/audit-table";
import { getAuditWorkspace } from "@/features/audit/services/audit.service";
import { BackupPanel } from "@/features/backups/components/backup-panel";
import { getBackupWorkspace } from "@/features/backups/services/backup.service";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ExportPanel } from "@/features/exports/components/export-panel";
import { ErrorLogTable } from "@/features/monitoring/components/error-log-table";
import { MonitoringSummaryCards } from "@/features/monitoring/components/monitoring-summary-cards";
import { SystemHealthPanel } from "@/features/monitoring/components/system-health-panel";
import { getMonitoringWorkspace } from "@/features/monitoring/services/monitoring.service";
import { permissions } from "@/features/rbac/permissions";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissions.adminAccess);
  const params = await searchParams;
  const filters = {
    action: firstValue(params.action),
    entityType: firstValue(params.entityType),
    from: firstValue(params.from),
    search: firstValue(params.search),
    to: firstValue(params.to),
    userId: firstValue(params.userId),
  };
  const [audit, backups, monitoring] = await Promise.all([
    getAuditWorkspace(filters),
    getBackupWorkspace(),
    getMonitoringWorkspace(),
  ]);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Administration"
        title="Audit, Monitoring & Backups"
        description="Rastreabilidade, observabilidade e recuperacao operacional do LandingForge."
      />
      <MonitoringSummaryCards summary={monitoring.summary} />
      <SystemHealthPanel
        deployment={monitoring.deployment}
        frequentErrors={monitoring.frequentErrors}
      />
      <ErrorLogTable logs={monitoring.latestErrors} />
      <AuditSummaryCards summary={audit.summary} totalFiltered={audit.total} />
      <AuditFilterBar
        actions={audit.actions}
        entityTypes={audit.entityTypes}
        filters={audit.filters}
        users={audit.users}
      />
      <AuditTable logs={audit.logs} />
      <BackupPanel
        backups={backups.backups}
        canCreate={hasPermission(user.permissions, permissions.backupsCreate)}
        summary={backups.summary}
      />
      {hasPermission(user.permissions, permissions.auditExport) ? <ExportPanel /> : null}
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
