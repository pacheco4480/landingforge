import { BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { ClientKnowledgeCategory } from "@/generated/prisma/client";
import {
  createClientKnowledgeEntryAction,
  updateClientKnowledgeEntryAction,
} from "@/features/clients/actions/client-knowledge.actions";
import { ClientKnowledgeDeleteButton } from "@/features/clients/components/client-knowledge-delete-button";

const categoryLabels: Record<ClientKnowledgeCategory, string> = {
  [ClientKnowledgeCategory.PAST_REQUEST]: "Pedido anterior",
  [ClientKnowledgeCategory.PREFERENCE]: "Preferência",
  [ClientKnowledgeCategory.APPROVED_STYLE]: "Estilo aprovado",
  [ClientKnowledgeCategory.REJECTED_STYLE]: "Estilo a evitar",
  [ClientKnowledgeCategory.NOTE]: "Nota interna",
};

type KnowledgeEntry = {
  id: string;
  projectId: string | null;
  category: ClientKnowledgeCategory;
  title: string;
  content: string;
  project: { name: string } | null;
};

type ProjectOption = { id: string; name: string };

function EntryFields({
  clientId,
  projects,
  entry,
}: {
  clientId: string;
  projects: ProjectOption[];
  entry?: KnowledgeEntry;
}) {
  return (
    <>
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`${entry?.id ?? "new"}-knowledge-category`}>Categoria</Label>
          <Select
            id={`${entry?.id ?? "new"}-knowledge-category`}
            name="category"
            defaultValue={entry?.category ?? ClientKnowledgeCategory.PREFERENCE}
          >
            {Object.values(ClientKnowledgeCategory).map((category) => (
              <option key={category} value={category}>{categoryLabels[category]}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor={`${entry?.id ?? "new"}-knowledge-project`}>Projeto associado</Label>
          <Select
            id={`${entry?.id ?? "new"}-knowledge-project`}
            name="projectId"
            defaultValue={entry?.projectId ?? ""}
          >
            <option value="">Conhecimento geral do cliente</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor={`${entry?.id ?? "new"}-knowledge-title`}>Título</Label>
        <Input
          id={`${entry?.id ?? "new"}-knowledge-title`}
          name="title"
          maxLength={160}
          required
          defaultValue={entry?.title ?? ""}
        />
      </Field>
      <Field>
        <Label htmlFor={`${entry?.id ?? "new"}-knowledge-content`}>Nota</Label>
        <Textarea
          id={`${entry?.id ?? "new"}-knowledge-content`}
          name="content"
          maxLength={3000}
          required
          defaultValue={entry?.content ?? ""}
          className="min-h-24"
        />
      </Field>
    </>
  );
}

export function ClientKnowledgeBase({
  clientId,
  entries,
  projects,
  canWrite,
}: {
  clientId: string;
  entries: KnowledgeEntry[];
  projects: ProjectOption[];
  canWrite: boolean;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-start gap-3">
        <BookOpen aria-hidden="true" className="text-muted-foreground mt-1 size-5" />
        <div>
          <h2 className="text-xl font-semibold">Conhecimento do cliente</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Preferências e decisões internas. Estas notas não são partilhadas nem incluídas automaticamente em contextos de IA.
          </p>
        </div>
      </div>

      {entries.length ? (
        <ul className="divide-border divide-y border-y">
          {entries.map((entry) => (
            <li key={entry.id} className="grid gap-3 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase">{categoryLabels[entry.category]}</p>
                  <h3 className="mt-1 font-semibold">{entry.title}</h3>
                  {entry.project ? <p className="text-muted-foreground mt-1 text-xs">Projeto: {entry.project.name}</p> : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
                </div>
                {canWrite ? <ClientKnowledgeDeleteButton id={entry.id} clientId={clientId} /> : null}
              </div>
              {canWrite ? (
                <details>
                  <summary className="text-primary cursor-pointer text-sm font-medium">Editar nota</summary>
                  <form action={updateClientKnowledgeEntryAction} className="mt-3 grid gap-3">
                    <EntryFields clientId={clientId} projects={projects} entry={entry} />
                    <div><Button type="submit">Guardar alterações</Button></div>
                  </form>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">Ainda não existem preferências ou decisões registadas.</p>
      )}

      {canWrite ? (
        <details className="border-border rounded-md border p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
            <Plus aria-hidden="true" className="size-4" /> Adicionar conhecimento
          </summary>
          <form action={createClientKnowledgeEntryAction} className="mt-4 grid gap-3">
            <EntryFields clientId={clientId} projects={projects} />
            <div><Button type="submit">Guardar nota</Button></div>
          </form>
        </details>
      ) : null}
    </section>
  );
}
