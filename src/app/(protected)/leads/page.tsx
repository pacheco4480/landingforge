import { permissions } from "@/features/rbac/permissions";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { updateLeadStatusAction } from "@/features/leads/actions/lead.actions";
import { LeadDetailPanel } from "@/features/leads/components/lead-detail-panel";
import { LeadExportButton } from "@/features/leads/components/lead-export-button";
import { LeadKanbanBoard } from "@/features/leads/components/lead-kanban-board";
import { LeadsDashboardCards } from "@/features/leads/components/leads-dashboard-cards";
import { LeadsFilterBar } from "@/features/leads/components/leads-filter-bar";
import { LeadsTable } from "@/features/leads/components/leads-table";
import { leadFiltersSchema } from "@/features/leads/schemas/lead.schema";
import { getLeadDashboardMetrics } from "@/features/leads/services/lead-dashboard.service";
import { getLeadsWorkspace } from "@/features/leads/services/lead.service";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissions.leadsRead);
  const rawParams = await searchParams;
  const filters = leadFiltersSchema.parse(normalizeSearchParams(rawParams));
  const [metrics, workspace] = await Promise.all([
    getLeadDashboardMetrics(),
    getLeadsWorkspace(filters),
  ]);
  const canWrite = hasPermission(user.permissions, permissions.leadsWrite);
  const canExport = hasPermission(user.permissions, permissions.leadsExport);

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <CmsPageHeader
          eyebrow="Pipeline"
          title="Leads"
          description="Gere contactos, acompanhe estados comerciais e exporte leads captados pelas landing pages."
        />
        {canExport ? <LeadExportButton filters={filters} /> : null}
      </div>
      <LeadsDashboardCards metrics={metrics} />
      <LeadsFilterBar
        filters={filters}
        forms={workspace.forms}
        sources={workspace.sources}
      />
      <section aria-labelledby="lead-pipeline-heading">
        <h2 id="lead-pipeline-heading" className="mb-4 text-xl font-semibold">
          Pipeline
        </h2>
        <LeadKanbanBoard
          columns={workspace.pipeline}
          canWrite={canWrite}
          updateAction={updateLeadStatusAction}
        />
      </section>
      <LeadsTable leads={workspace.leads} canWrite={canWrite} />
      <LeadDetailPanel
        lead={workspace.selectedLead}
        activity={workspace.auditLogs}
        canWrite={canWrite}
      />
    </div>
  );
}

function normalizeSearchParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}
