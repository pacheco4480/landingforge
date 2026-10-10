import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { PageForm } from "@/features/content/components/page-form";
import { listTemplatesWithVariants } from "@/features/content/services/page.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function NewPagePage() {
  await requirePermission(permissions.pagesWrite);
  const templates = await listTemplatesWithVariants();

  return (
    <div className="grid gap-6">
      <CmsPageHeader
        eyebrow="Create"
        title="Create Page"
        description="Create a new landing page record with validated title, slug and status."
      />
      <PageForm templates={templates} />
    </div>
  );
}
