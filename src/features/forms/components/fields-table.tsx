import type { FormField } from "@/generated/prisma/client";
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
  deleteFormFieldAction,
  moveFormFieldAction,
} from "@/features/forms/actions/form-field.actions";
import { FieldForm } from "@/features/forms/components/field-editor";

export function FieldsTable({
  fields,
  canWrite,
}: {
  fields: FormField[];
  canWrite: boolean;
}) {
  const formId = fields[0]?.formId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos</CardTitle>
        <CardDescription>
          Ordem, visibilidade e validação dos campos.
        </CardDescription>
      </CardHeader>
      <DataTable
        caption="Campos do formulário"
        columns={["Rótulo", "Identificador", "Tipo", "Obrigatório", "Visível", "Ações"]}
        rows={fields.map((field) => [
          field.label,
          field.name,
          field.type.toLowerCase(),
          field.isRequired ? "Sim" : "Não",
          field.isVisible ? "Sim" : "Não",
          <div className="flex flex-wrap gap-2" key={field.id}>
            {canWrite ? (
              <>
                <ActionFeedbackForm
                  action={moveFormFieldAction}
                  loadingMessage="A mover campo..."
                  successMessage="Campo movido."
                  preventDuplicateSubmit
                >
                  <input name="id" type="hidden" value={field.id} />
                  <input name="direction" type="hidden" value="up" />
                  <Button type="submit" variant="outline" size="sm">
                    Subir
                  </Button>
                </ActionFeedbackForm>
                <ActionFeedbackForm
                  action={moveFormFieldAction}
                  loadingMessage="A mover campo..."
                  successMessage="Campo movido."
                  preventDuplicateSubmit
                >
                  <input name="id" type="hidden" value={field.id} />
                  <input name="direction" type="hidden" value="down" />
                  <Button type="submit" variant="outline" size="sm">
                    Descer
                  </Button>
                </ActionFeedbackForm>
                <ConfirmActionForm
                  action={deleteFormFieldAction}
                  title="Eliminar campo?"
                  description="Este campo será removido do formulário."
                  confirmLabel="Eliminar"
                  loadingMessage="A eliminar campo..."
                  successMessage="Campo eliminado."
                >
                  <input name="id" type="hidden" value={field.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Eliminar
                  </Button>
                </ConfirmActionForm>
              </>
            ) : (
              "Só de leitura"
            )}
          </div>,
        ])}
        scrollHint="Use as setas do teclado ou deslize horizontalmente para consultar todas as colunas."
        scrollRegionLabel="Tabela de campos, deslocável horizontalmente"
      />
      {canWrite && formId ? (
        <div className="mt-6 grid gap-6 border-t pt-6">
          <div>
            <h3 className="font-semibold">Editar campos existentes</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Usa estes blocos para alterar label, name, validação, opções e
              lógica condicional de campos já criados.
            </p>
          </div>
          {fields.map((field) => (
            <div className="rounded-md border p-4" key={field.id}>
              <h4 className="mb-4 text-sm font-semibold">{field.label}</h4>
              <FieldForm field={field} fields={fields} formId={formId} />
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
