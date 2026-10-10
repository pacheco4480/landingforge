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
        eyebrow="CMS Home"
        title="Dashboard"
        description="Monitor lead activity, page readiness and the operational status of the LandingForge CMS."
      />
      <DashboardMetricGrid metrics={metrics} />
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-4 text-xl font-semibold">
          Quick Actions
        </h2>
        <DashboardQuickActions />
      </section>
      <section aria-labelledby="foundations-heading">
        <h2 id="foundations-heading" className="mb-4 text-xl font-semibold">
          CMS Foundations
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
