import Link from "next/link";

import {
  ActionFeedbackForm,
  ConfirmActionForm,
} from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { EmptyState, Table } from "@/components/ui/data-display";
import {
  archivePageAction,
  deletePageAction,
  duplicatePageAction,
} from "@/features/content/actions/page.actions";
import { PageStatusBadge } from "@/features/content/components/page-status-badge";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
  isDemo: boolean;
  demoKey: string | null;
  template: { key: string; name: string } | null;
  templateVariant: { key: string; name: string } | null;
};

export function PagesTable({
  pages,
  canWrite,
}: {
  pages: PageRow[];
  canWrite: boolean;
}) {
  if (pages.length === 0) {
    return (
      <EmptyState
        title="No pages yet"
        description="Create the first landing page or seed internal demos to start editing content."
      />
    );
  }

  return (
    <Table>
      <thead className="border-border text-muted-foreground border-b text-xs uppercase">
        <tr>
          <th className="px-3 py-2" scope="col">
            Name
          </th>
          <th className="px-3 py-2" scope="col">
            Slug
          </th>
          <th className="px-3 py-2" scope="col">
            Template
          </th>
          <th className="px-3 py-2" scope="col">
            Variant
          </th>
          <th className="px-3 py-2" scope="col">
            Status
          </th>
          <th className="px-3 py-2" scope="col">
            Last Update
          </th>
          <th className="px-3 py-2" scope="col">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {pages.map((page) => (
          <tr className="border-border border-b last:border-0" key={page.id}>
            <td className="px-3 py-3">
              <div className="font-medium">{page.title}</div>
              {page.isDemo ? (
                <div className="text-muted-foreground text-xs">
                  {page.demoKey}
                </div>
              ) : null}
            </td>
            <td className="text-muted-foreground px-3 py-3 text-sm">
              {page.slug}
            </td>
            <td className="px-3 py-3 text-sm">
              {page.template?.name ?? "No template"}
            </td>
            <td className="px-3 py-3 text-sm">
              {page.templateVariant?.name ?? "No variant"}
            </td>
            <td className="px-3 py-3">
              <PageStatusBadge status={page.status} />
            </td>
            <td className="text-muted-foreground px-3 py-3 text-sm">
              {page.updatedAt.toLocaleDateString("en")}
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  className="border-border hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                  href={`/pages/${page.id}/edit`}
                >
                  Edit
                </Link>
                <Link
                  className="border-border hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                  href={`/content/${page.id}`}
                >
                  Content
                </Link>
                {canWrite ? (
                  <>
                    <ActionFeedbackForm
                      action={duplicatePageAction}
                      loadingMessage="A duplicar pagina..."
                      successMessage="Pagina duplicada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="outline">
                        Duplicate
                      </Button>
                    </ActionFeedbackForm>
                    <ConfirmActionForm
                      action={archivePageAction}
                      title="Arquivar pagina?"
                      description="A pagina deixa de estar disponivel publicamente e sai do sitemap."
                      confirmLabel="Arquivar"
                      loadingMessage="A arquivar pagina..."
                      successMessage="Pagina arquivada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="outline">
                        Archive
                      </Button>
                    </ConfirmActionForm>
                    <ConfirmActionForm
                      action={deletePageAction}
                      title="Eliminar pagina?"
                      description="A pagina será removida do CMS e do acesso publico."
                      confirmLabel="Eliminar"
                      loadingMessage="A eliminar pagina..."
                      successMessage="Pagina eliminada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="destructive">
                        Delete
                      </Button>
                    </ConfirmActionForm>
                  </>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
