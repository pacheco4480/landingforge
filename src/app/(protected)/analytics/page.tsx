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
        eyebrow="Desempenho"
        title="Análise"
        description="Base para visualizações de páginas, eventos de conversão e relatórios."
      />
      <CmsEmptyState
        icon={BarChart3}
        title="Os indicadores detalhados ainda estão em preparação"
        description="A análise detalhada e os funis de conversão serão considerados numa fase futura do motor de páginas e formulários."
      />
    </div>
  );
}
