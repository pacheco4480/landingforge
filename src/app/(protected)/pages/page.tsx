import Link from "next/link";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { canEditContent } from "@/features/content/content-mode";
import { PagesTable } from "@/features/content/components/pages-table";
import { listPagesForUser } from "@/features/content/services/page.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function PagesPage() {
  const user = await requirePermission(permissions.pagesRead);
  const pages = await listPagesForUser(user.roles);
  const canWrite = canEditContent(user.permissions);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <CmsPageHeader
          eyebrow="Landing Pages"
          title="Pages"
          description="Create, edit, duplicate, archive and organize landing pages."
        />
        {canWrite ? (
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 w-fit items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
            href="/pages/new"
          >
            Create page
          </Link>
        ) : null}
      </div>
      <PagesTable canWrite={canWrite} pages={pages} />
    </div>
  );
}
