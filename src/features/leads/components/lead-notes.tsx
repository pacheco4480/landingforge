import { Pencil, Trash2 } from "lucide-react";

import {
  ActionFeedbackForm,
  ConfirmActionForm,
} from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Label, Textarea } from "@/components/ui/form";
import {
  deleteLeadNoteAction,
  saveLeadNoteAction,
} from "@/features/leads/actions/lead.actions";

type LeadNoteRow = {
  id: string;
  leadId: string;
  note: string;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
};

export function LeadNotes({
  leadId,
  notes,
  canWrite,
}: {
  leadId: string;
  notes: LeadNoteRow[];
  canWrite: boolean;
}) {
  return (
    <div className="grid gap-4">
      {canWrite ? (
        <ActionFeedbackForm
          action={saveLeadNoteAction}
          className="grid gap-3"
          loadingMessage="A guardar nota..."
          successMessage="Nota guardada."
        >
          <input name="leadId" type="hidden" value={leadId} />
          <Field>
            <Label htmlFor="new-lead-note">Nova nota</Label>
            <Textarea
              id="new-lead-note"
              name="note"
              minLength={2}
              maxLength={2000}
              required
              placeholder="Resumo do contacto, próximos passos ou contexto comercial."
            />
          </Field>
          <Button type="submit">Adicionar nota</Button>
        </ActionFeedbackForm>
      ) : null}
      <div className="grid gap-3">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ainda não há notas.</p>
        ) : null}
        {notes.map((note) => (
          <article className="border-border rounded-md border p-3" key={note.id}>
            <p className="whitespace-pre-wrap text-sm">{note.note}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {note.user?.name ?? note.user?.email ?? "Sistema"} ·{" "}
              {note.createdAt.toLocaleString("pt-PT")}
            </p>
            {canWrite ? (
              <div className="mt-3 grid gap-3">
                <details>
                  <summary className="text-primary inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </summary>
                  <ActionFeedbackForm
                    action={saveLeadNoteAction}
                    className="mt-3 grid gap-3"
                    loadingMessage="A atualizar nota..."
                    successMessage="Nota atualizada."
                  >
                    <input name="id" type="hidden" value={note.id} />
                    <input name="leadId" type="hidden" value={leadId} />
                    <Textarea
                      name="note"
                      defaultValue={note.note}
                      minLength={2}
                      maxLength={2000}
                      required
                    />
                    <Button type="submit" size="sm">
                      Guardar nota
                    </Button>
                  </ActionFeedbackForm>
                </details>
                <ConfirmActionForm
                  action={deleteLeadNoteAction}
                  title="Eliminar nota?"
                  description="A nota será removida do histórico visível deste lead."
                  confirmLabel="Eliminar"
                  loadingMessage="A eliminar nota..."
                  successMessage="Nota eliminada."
                >
                  <input name="id" type="hidden" value={note.id} />
                  <input name="leadId" type="hidden" value={leadId} />
                  <Button type="submit" variant="outline" size="sm">
                    <Trash2 className="size-4" aria-hidden="true" />
                    Eliminar
                  </Button>
                </ConfirmActionForm>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
