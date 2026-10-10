import { redirect } from "next/navigation";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { DemoManagement } from "@/features/content/components/demo-management";
import { getContentMode } from "@/features/content/content-mode";
import { getDemoWorkspace } from "@/features/content/services/demo.service";
import { getEditablePageOptions } from "@/features/content/services/page.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission(permissions.cmsRead);
  const mode = getContentMode(user.roles);
  const filters = await searchParams;
  const pages = await getEditablePageOptions(user.roles);
  const workspace = mode.canUseDemoMode
    ? await getDemoWorkspace(user.roles, {
        industryId: firstValue(filters.industryId),
        search: firstValue(filters.search),
        status: firstValue(filters.status),
        templateId: firstValue(filters.templateId),
        templateVariantId: firstValue(filters.templateVariantId),
      })
    : null;

  if (!mode.canUseDemoMode && pages[0]) {
    redirect(`/content/${pages[0].id}`);
  }

  return (
    <div className="grid gap-6">
      <CmsPageHeader
        eyebrow="Structured Content"
        title="Content"
        description="Edit page content and sections while preserving demo/client isolation."
      />
      {workspace ? (
        <DemoManagement
          demos={workspace.demos}
          filters={workspace.filters}
          industries={workspace.industries}
          templates={workspace.templates}
          themes={workspace.themes}
        />
      ) : null}
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
