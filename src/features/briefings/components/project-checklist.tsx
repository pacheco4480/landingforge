import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { updateProjectChecklistAction } from "@/features/briefings/actions/briefing.actions";
import {
  projectChecklistItems,
  projectChecklistProgress,
  type ProjectChecklistRecord,
} from "@/features/briefings/project-checklist";

const statusLabels = {
  MISSING: "Em falta",
  IN_PROGRESS: "Em curso",
  COMPLETE: "Concluído",
  NOT_APPLICABLE: "Não aplicável",
} as const;

export function ProjectChecklist({
  projectId,
  items,
  canWrite,
}: {
  projectId: string;
  items: ProjectChecklistRecord[];
  canWrite: boolean;
}) {
  const progress = projectChecklistProgress(items);

  return (
    <section className="border-border grid gap-4 border-t pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">Checklist de entrega</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe os elementos necessários antes da entrega.
          </p>
        </div>
        <p className="text-sm font-medium">
          {progress.complete} de {progress.total} · {progress.percent}%
        </p>
      </div>
      <progress
        className="accent-primary h-2 w-full"
        value={progress.complete}
        max={progress.total}
        aria-label={`Checklist concluído: ${progress.percent}%`}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {projectChecklistItems.map(({ key, label }) => {
          const item = items.find((entry) => entry.key === key)!;
          return (
            <article
              className="border-border grid gap-3 rounded-md border p-3"
              key={key}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{label}</h4>
                <span className="text-muted-foreground text-xs">
                  {statusLabels[item.status]}
                </span>
              </div>
              {canWrite ? (
                <ActionFeedbackForm
                  action={updateProjectChecklistAction}
                  loadingMessage="A atualizar checklist..."
                  successMessage="Estado do checklist atualizado."
                  className="grid gap-3"
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="key" value={key} />
                  <Field>
                    <Label htmlFor={`checklist-status-${projectId}-${key}`}>
                      Estado
                    </Label>
                    <Select
                      id={`checklist-status-${projectId}-${key}`}
                      name="status"
                      defaultValue={item.status}
                    >
                      {Object.entries(statusLabels).map(([value, text]) => (
                        <option key={value} value={value}>
                          {text}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {key === "PAYMENT" ? (
                    <Field>
                      <Label htmlFor={`checklist-reference-${projectId}`}>
                        Referência comercial (opcional)
                      </Label>
                      <Input
                        id={`checklist-reference-${projectId}`}
                        name="reference"
                        defaultValue={item.reference ?? ""}
                        maxLength={120}
                      />
                      <p className="text-muted-foreground text-xs">
                        Não introduza dados de cartão ou credenciais bancárias.
                      </p>
                    </Field>
                  ) : null}
                  <Field>
                    <Label htmlFor={`checklist-note-${projectId}-${key}`}>
                      Nota interna (opcional)
                    </Label>
                    <Textarea
                      id={`checklist-note-${projectId}-${key}`}
                      name="note"
                      defaultValue={item.note ?? ""}
                      maxLength={1000}
                      rows={2}
                    />
                  </Field>
                  <Button type="submit" size="sm" variant="outline">
                    Guardar
                  </Button>
                </ActionFeedbackForm>
              ) : item.note ? (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {item.note}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        O progresso conta os itens concluídos ou não aplicáveis. O estado de
        pagamento e a referência são registos comerciais, não dados bancários.
      </p>
    </section>
  );
}
