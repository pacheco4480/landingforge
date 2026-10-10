import { permissions } from "@/features/rbac/permissions";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { DeploymentChecklist } from "@/features/deployment/components/deployment-checklist";
import { DeploymentSettingsForm } from "@/features/deployment/components/deployment-settings-form";
import { DeploymentStatusPanel } from "@/features/deployment/components/deployment-status-panel";
import { EnvironmentChecklist } from "@/features/deployment/components/environment-checklist";
import { getDeploymentWorkspace } from "@/features/deployment/services/deployment.service";
import { NotificationSettingsForm } from "@/features/settings/components/notification-settings-form";
import { SecurityOverview } from "@/features/settings/components/security-overview";
import { SecuritySettingsForm } from "@/features/settings/components/security-settings-form";
import { LegalOverview } from "@/features/legal/components/legal-overview";
import { LegalSettingsForm } from "@/features/legal/components/legal-settings-form";
import { getLegalSettingsWorkspace } from "@/features/legal/services/legal-settings.service";
import { getNotificationSettingsOverview } from "@/features/settings/services/notification-settings.service";
import { getSecuritySettingsWorkspace } from "@/features/settings/services/security-settings.service";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function SettingsPage() {
  const user = await requirePermission(permissions.settingsRead);
  const [settings, security, legal, deployment] = await Promise.all([
    getNotificationSettingsOverview(),
    getSecuritySettingsWorkspace(),
    getLegalSettingsWorkspace(),
    getDeploymentWorkspace(),
  ]);
  const canWrite = hasPermission(user.permissions, permissions.settingsWrite);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Central area for site settings, notifications and publishing configuration."
      />
      <DeploymentStatusPanel workspace={deployment} />
      <DeploymentSettingsForm workspace={deployment} canWrite={canWrite} />
      <div className="grid gap-8 lg:grid-cols-2">
        <DeploymentChecklist items={deployment.checklist} />
        <EnvironmentChecklist cmsEnabled={deployment.cmsEnabled} />
      </div>
      <NotificationSettingsForm settings={settings} canWrite={canWrite} />
      <LegalSettingsForm
        settings={legal.settings}
        legalPages={legal.legalPages}
        canWrite={canWrite}
      />
      <LegalOverview />
      <SecuritySettingsForm settings={security.settings} canWrite={canWrite} />
      <SecurityOverview summary={security.summary} />
    </div>
  );
}
