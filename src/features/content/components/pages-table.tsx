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
        title="Ainda não existem páginas"
        description="Cria a primeira landing page ou adiciona demonstrações internas para começar a editar conteúdo."
      />
    );
  }

  return (
    <Table>
      <thead className="border-border text-muted-foreground border-b text-xs uppercase">
        <tr>
          <th className="px-3 py-2" scope="col">
            Nome
          </th>
          <th className="px-3 py-2" scope="col">
            Slug
          </th>
          <th className="px-3 py-2" scope="col">
            Modelo
          </th>
          <th className="px-3 py-2" scope="col">
            Variante
          </th>
          <th className="px-3 py-2" scope="col">
            Estado
          </th>
          <th className="px-3 py-2" scope="col">
            Última atualização
          </th>
          <th className="px-3 py-2" scope="col">
            Acções
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
              {page.template?.name ?? "Sem modelo"}
            </td>
            <td className="px-3 py-3 text-sm">
              {page.templateVariant?.name ?? "Sem variante"}
            </td>
            <td className="px-3 py-3">
              <PageStatusBadge status={page.status} />
            </td>
            <td className="text-muted-foreground px-3 py-3 text-sm">
              {page.updatedAt.toLocaleDateString("pt-PT")}
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  className="border-border hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                  href={`/pages/${page.id}/edit`}
                >
                  Editar
                </Link>
                <Link
                  className="border-border hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
                  href={`/content/${page.id}`}
                >
                  Conteúdo
                </Link>
                {canWrite ? (
                  <>
                    <ActionFeedbackForm
                      action={duplicatePageAction}
                      loadingMessage="A duplicar página..."
                      successMessage="Página duplicada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="outline">
                        Duplicar
                      </Button>
                    </ActionFeedbackForm>
                    <ConfirmActionForm
                      action={archivePageAction}
                      title="Arquivar página?"
                      description="A página deixa de estar disponível publicamente e sai do sitemap."
                      confirmLabel="Arquivar"
                      loadingMessage="A arquivar página..."
                      successMessage="Página arquivada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="outline">
                        Arquivar
                      </Button>
                    </ConfirmActionForm>
                    <ConfirmActionForm
                      action={deletePageAction}
                      title="Eliminar página?"
                      description="A página será removida do CMS e do acesso público."
                      confirmLabel="Eliminar"
                      loadingMessage="A eliminar página..."
                      successMessage="Página eliminada."
                    >
                      <input name="id" type="hidden" value={page.id} />
                      <Button size="sm" type="submit" variant="destructive">
                        Eliminar
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
