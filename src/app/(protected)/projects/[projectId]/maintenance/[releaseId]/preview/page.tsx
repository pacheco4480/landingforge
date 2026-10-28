import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { PublicPageRenderer } from "@/features/public-renderer/components/public-page-renderer";
import { getMaintenanceReleasePreview } from "@/features/projects/services/project-maintenance.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ProjectMaintenancePreviewPage({ params }: { params: Promise<{ projectId: string; releaseId: string }> }) {
  const actor = await requirePermission(permissions.projectsWrite);
  const { projectId, releaseId } = await params;
  let context;
  try {
    context = await getMaintenanceReleasePreview(projectId, releaseId, actor);
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="bg-background border-border sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <CmsPageHeader eyebrow="Pré-visualização privada" title={context.page.title} description="Não está publicada. Os formulários estão desativados neste preview." />
        <Link href={`/projects/${projectId}/maintenance/${releaseId}`}><Button variant="outline">Voltar à edição</Button></Link>
      </div>
      <PublicPageRenderer context={context} />
    </div>
  );
}
