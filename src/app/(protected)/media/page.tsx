import { permissions } from "@/features/rbac/permissions";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { MediaFolderTree } from "@/features/media/components/media-folder-tree";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaSearch } from "@/features/media/components/media-search";
import { MediaUploadForm } from "@/features/media/components/media-upload-form";
import {
  listFolders,
  listMediaAssets,
} from "@/features/media/services/media.service";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requirePermission(permissions.mediaRead);
  const { q = "" } = await searchParams;
  const [assets, folders] = await Promise.all([
    listMediaAssets(q),
    listFolders(),
  ]);
  const canWrite = hasPermission(user.permissions, permissions.mediaWrite);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Assets"
        title="Media"
        description="Upload, organize, preview and manage landing page media assets."
      />
      <MediaSearch query={q} />
      {canWrite ? <MediaUploadForm folders={folders} /> : null}
      {canWrite ? <MediaFolderTree folders={folders} /> : null}
      <MediaGrid
        assets={assets}
        canDelete={canWrite}
        canWrite={canWrite}
        folders={folders}
      />
    </div>
  );
}
