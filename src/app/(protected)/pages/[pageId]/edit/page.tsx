import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ContentHistoryFoundation } from "@/features/content/components/content-history-foundation";
import { PageForm } from "@/features/content/components/page-form";
import { SectionList } from "@/features/content/components/section-list";
import { canEditContent } from "@/features/content/content-mode";
import {
  getPageForUser,
  listTemplatesWithVariants,
} from "@/features/content/services/page.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const user = await requirePermission(permissions.pagesRead);
  const { pageId } = await params;
  const [page, templates] = await Promise.all([
    getPageForUser(pageId, user.roles),
    listTemplatesWithVariants(),
  ]);
  const canWrite = canEditContent(user.permissions);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <CmsPageHeader
          eyebrow={page.isDemo ? "Demo Page" : "Client Page"}
          title={`Edit ${page.title}`}
          description="Manage page metadata and review the section structure."
        />
        <Link href={`/content/${page.id}`}>
          <Button type="button" variant="outline">
            Edit content
          </Button>
        </Link>
      </div>
      {canWrite ? <PageForm page={page} templates={templates} /> : null}
      <ContentHistoryFoundation />
      <section aria-labelledby="page-sections-heading">
        <h2 id="page-sections-heading" className="mb-4 text-xl font-semibold">
          Sections
        </h2>
        <SectionList canWrite={false} sections={page.sections} />
      </section>
    </div>
  );
}
