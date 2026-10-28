import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { PrivacyWorkspace } from "@/features/privacy/components/privacy-workspace";
import { getPrivacyWorkspace } from "@/features/privacy/services/privacy.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function PrivacyPage() {
  await requirePermission(permissions.adminAccess);
  const data = await getPrivacyWorkspace();
  return (
    <div className="grid gap-6">
      <CmsPageHeader
        eyebrow="Administração"
        title="Privacidade e ciclo de vida"
        description="Políticas operacionais, revisão de retenção e acompanhamento de pedidos de titulares."
      />
      <PrivacyWorkspace data={data} />
    </div>
  );
}
