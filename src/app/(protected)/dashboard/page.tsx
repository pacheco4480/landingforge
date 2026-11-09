import { permissions } from "@/features/rbac/permissions";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import {
  DashboardFoundations,
  DashboardMetricGrid,
  DashboardQuickActions,
} from "@/features/cms/dashboard/dashboard-widgets";
import { getDashboardMetrics } from "@/features/cms/dashboard/dashboard.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function DashboardPage() {
  const user = await requirePermission(permissions.dashboardRead);
  const metrics = await getDashboardMetrics(user.id);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Área de gestão"
        title="Painel"
        description="Acompanha os contactos recebidos, a preparação das páginas e o estado operacional do LandingForge."
      />
      <DashboardMetricGrid metrics={metrics} />
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-4 text-xl font-semibold">
          Acesso rápido
        </h2>
        <DashboardQuickActions userPermissions={user.permissions} />
      </section>
      <section aria-labelledby="foundations-heading">
        <h2 id="foundations-heading" className="mb-4 text-xl font-semibold">
          Visão geral do CMS
        </h2>
        <DashboardFoundations
          backupSummary={metrics.backupSummary}
          deploymentSummary={metrics.deploymentSummary}
          notificationOverview={metrics.notificationOverview}
          recentAuditActivity={metrics.recentAuditActivity}
          securitySummary={metrics.securitySummary}
        />
      </section>
    </div>
  );
}
