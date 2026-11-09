import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { Alert } from "@/components/ui/feedback";
import { BrandingForm } from "@/features/branding/components/branding-form";
import { LogoManager } from "@/features/branding/components/logo-manager";
import { ThemeForm } from "@/features/branding/components/theme-form";
import { ThemeList } from "@/features/branding/components/theme-list";
import { getBrandingSettings } from "@/features/branding/services/branding.service";
import { listThemes } from "@/features/branding/services/theme.service";
import { listPagesForUser } from "@/features/content/services/page.service";
import { listMediaAssets } from "@/features/media/services/media.service";
import { permissions } from "@/features/rbac/permissions";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function BrandingPage() {
  const user = await requirePermission(permissions.settingsRead);
  const [settings, themes, pages, mediaAssets] = await Promise.all([
    getBrandingSettings(),
    listThemes(),
    listPagesForUser(user.roles),
    listMediaAssets(),
  ]);
  const canWrite = hasPermission(user.permissions, permissions.settingsWrite);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Identidade visual"
        title="Identidade da marca"
        description="Gere a identidade da marca, o logótipo, o favicon, as cores, a tipografia e as pré-visualizações de temas."
      />
      <Alert tone="info" title="Como o branding se aplica">
        A identidade global alimenta SEO, contactos e templates sem tema
        próprio. Quando uma página tem um tema aplicado, esse tema pode
        sobrepor cores e tipografia da identidade global.
      </Alert>
      {canWrite ? <BrandingForm settings={settings} /> : null}
        <LogoManager
        assets={mediaAssets}
        faviconId={settings.faviconMediaId}
        logoId={settings.logoMediaId}
          canWrite={canWrite}
      />
      {canWrite ? <ThemeForm /> : null}
      <ThemeList
        pages={pages.map((page) => ({ id: page.id, title: page.title }))}
        themes={themes}
        canWrite={canWrite}
      />
    </div>
  );
}
