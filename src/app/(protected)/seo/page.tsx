import { permissions } from "@/features/rbac/permissions";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { LocalSeoForm } from "@/features/seo/components/local-seo-form";
import { RedirectsManager } from "@/features/seo/components/redirects-manager";
import { SeoPageSelector } from "@/features/seo/components/seo-page-selector";
import { SeoSettingsForm } from "@/features/seo/components/seo-settings-form";
import { SeoValidationPanel } from "@/features/seo/components/seo-validation-panel";
import { SocialPreview } from "@/features/seo/components/social-preview";
import { StructuredDataPreview } from "@/features/seo/components/structured-data-preview";
import { getSeoWorkspace } from "@/features/seo/services/seo.service";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ pageId?: string }>;
}) {
  const user = await requirePermission(permissions.seoRead);
  const { pageId } = await searchParams;
  const workspace = await getSeoWorkspace(pageId, user.roles);
  const canWrite = hasPermission(user.permissions, permissions.seoWrite);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Search Visibility"
        title="SEO"
        description="Manage metadata, indexation, structured data and redirect foundations for landing pages."
      />
      <SeoPageSelector
        pages={workspace.pages}
        selectedPageId={workspace.page?.id}
      />
      {workspace.page?.seoSetting ? (
        <>
          <SeoValidationPanel
            score={workspace.score}
            checks={workspace.checks}
          />
          <SeoSettingsForm
            seoSetting={workspace.page.seoSetting}
            mediaAssets={workspace.mediaAssets}
            canWrite={canWrite}
          />
          <SocialPreview
            title={
              workspace.page.seoSetting.ogTitle ??
              workspace.page.seoSetting.metaTitle
            }
            description={
              workspace.page.seoSetting.ogDescription ??
              workspace.page.seoSetting.metaDescription
            }
            canonicalUrl={
              workspace.page.seoSetting.canonicalUrl ??
              `/${workspace.page.slug}`
            }
            siteName={workspace.site.siteName}
            imageUrl={workspace.page.seoSetting.ogImageMedia?.publicUrl}
          />
          <StructuredDataPreview
            schemaJson={workspace.page.seoSetting.schemaJson}
          />
        </>
      ) : null}
      <LocalSeoForm site={workspace.site} canWrite={canWrite} />
      <RedirectsManager redirects={workspace.redirects} canWrite={canWrite} />
    </div>
  );
}
