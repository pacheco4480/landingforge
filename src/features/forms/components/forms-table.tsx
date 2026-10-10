import type { FormStatus, FormType } from "@/generated/prisma/client";
import {
  ActionFeedbackForm,
  ConfirmActionForm,
} from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-display";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";
import {
  archiveFormAction,
  deleteFormAction,
  duplicateFormAction,
} from "@/features/forms/actions/form.actions";

type FormRow = {
  id: string;
  name: string;
  key: string;
  type: FormType;
  status: FormStatus;
  page: { title: string; slug: string } | null;
  _count: { fields: number; submissions: number };
};

export function FormsTable({
  forms,
  selectedFormId,
  canWrite,
}: {
  forms: FormRow[];
  selectedFormId?: string;
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forms</CardTitle>
        <CardDescription>
          Reusable lead capture forms for landing pages.
        </CardDescription>
      </CardHeader>
      <DataTable
        columns={["Name", "Page", "Status", "Fields", "Submissions", "Actions"]}
        rows={forms.map((form) => [
          <a
            className={
              form.id === selectedFormId
                ? "text-primary font-semibold"
                : "font-medium"
            }
            href={`/forms?formId=${form.id}`}
            key={`${form.id}-link`}
          >
            {form.name}
            <span className="text-muted-foreground block text-xs">
              {form.key}
            </span>
          </a>,
          form.page ? `${form.page.title} /${form.page.slug}` : "Global",
          form.status.toLowerCase(),
          form._count.fields,
          form._count.submissions,
          <div className="flex flex-wrap gap-2" key={`${form.id}-actions`}>
            {canWrite ? (
              <>
                <a
                  className="border-border bg-background text-foreground hover:bg-muted inline-flex min-h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold transition-colors"
                  href={`/forms?formId=${form.id}`}
                >
                  Edit
                </a>
                <ActionFeedbackForm
                  action={duplicateFormAction}
                  loadingMessage="A duplicar formulário..."
                  successMessage="Formulário duplicado."
                >
                  <input name="id" type="hidden" value={form.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Duplicate
                  </Button>
                </ActionFeedbackForm>
                <ConfirmActionForm
                  action={archiveFormAction}
                  title="Arquivar formulário?"
                  description="O formulário deixa de aceitar submissões quando estiver arquivado."
                  confirmLabel="Arquivar"
                  loadingMessage="A arquivar formulário..."
                  successMessage="Formulário arquivado."
                >
                  <input name="id" type="hidden" value={form.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Archive
                  </Button>
                </ConfirmActionForm>
                <ConfirmActionForm
                  action={deleteFormAction}
                  title="Eliminar formulário?"
                  description="O formulário será removido da lista. As submissões existentes ficam preservadas na base de dados."
                  confirmLabel="Eliminar"
                  loadingMessage="A eliminar formulário..."
                  successMessage="Formulário eliminado."
                >
                  <input name="id" type="hidden" value={form.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete
                  </Button>
                </ConfirmActionForm>
              </>
            ) : (
              "Read only"
            )}
          </div>,
        ])}
      />
    </Card>
  );
}
