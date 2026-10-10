import type { DemoStatus } from "@/generated/prisma/client";
import { DemoCard, type DemoCardValue } from "@/features/content/components/demo-card";
import { DemoCreateForm } from "@/features/content/components/demo-create-form";
import { DemoFilterBar } from "@/features/content/components/demo-filter-bar";
import { EmptyState } from "@/components/ui/data-display";
import { Grid } from "@/components/ui/layout";

export function DemoManagement({
  demos,
  filters,
  industries,
  templates,
  themes,
}: {
  demos: DemoCardValue[];
  filters: {
    search?: string;
    status?: DemoStatus;
    industryId?: string;
    templateId?: string;
    templateVariantId?: string;
  };
  industries: Array<{ id: string; name: string }>;
  templates: Array<{
    id: string;
    name: string;
    industryId: string;
    variants: Array<{ id: string; name: string }>;
  }>;
  themes: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-6">
      <DemoCreateForm templates={templates} themes={themes} />
      <DemoFilterBar filters={filters} industries={industries} templates={templates} />
      {demos.length === 0 ? (
        <EmptyState title="No demos found" description="Create or adjust filters to manage internal demos." />
      ) : (
        <Grid className="lg:grid-cols-2 xl:grid-cols-3">
          {demos.map((demo) => <DemoCard demo={demo} key={demo.id} />)}
        </Grid>
      )}
    </div>
  );
}
