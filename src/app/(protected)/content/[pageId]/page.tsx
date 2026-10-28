import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ContentHistoryFoundation } from "@/features/content/components/content-history-foundation";
import { ContentPreview } from "@/features/content/components/content-preview";
import { DemoSettingsPanel } from "@/features/content/components/demo-settings-panel";
import { CreateSectionForm } from "@/features/content/components/section-form";
import { SectionList } from "@/features/content/components/section-list";
import { canEditContent } from "@/features/content/content-mode";
import {
  getPageForUser,
  listTemplatesWithVariants,
} from "@/features/content/services/page.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const user = await requirePermission(permissions.cmsRead);
  const { pageId } = await params;
  const page = await getPageForUser(pageId, user.roles, user);
  const canWrite = canEditContent(user.permissions);
  const [templates, themes] = await Promise.all([
    listTemplatesWithVariants(),
    db.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <CmsPageHeader
        eyebrow={page.isDemo ? "Internal Demo" : "Client Mode"}
        title={`Content: ${page.title}`}
        description="Edit content sections, ordering and visibility for this landing page."
      />
      {page.isDemo && canWrite ? (
        <DemoSettingsPanel page={page} templates={templates} themes={themes} />
      ) : null}
      {canWrite ? <CreateSectionForm pageId={page.id} /> : null}
      <SectionList
        canWrite={canWrite}
        sections={page.sections}
        templateKey={page.template?.key}
        templateVariantKey={page.templateVariant?.key}
      />
      <ContentPreview sections={page.sections} />
      <ContentHistoryFoundation />
    </div>
  );
}
