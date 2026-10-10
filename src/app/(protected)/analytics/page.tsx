import { BarChart3 } from "lucide-react";

import { CmsEmptyState } from "@/features/cms/components/cms-empty-state";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function AnalyticsPage() {
  await requirePermission(permissions.dashboardRead);

  return (
    <div>
      <CmsPageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Foundation for page views, conversion events and reporting widgets."
      />
      <CmsEmptyState
        icon={BarChart3}
        title="Analytics widgets are planned"
        description="Detailed analytics and conversion funnels remain future work after the renderer and forms engine exist."
      />
    </div>
  );
}
