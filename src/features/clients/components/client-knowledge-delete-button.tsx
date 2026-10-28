"use client";

import { Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { deleteClientKnowledgeEntryAction } from "@/features/clients/actions/client-knowledge.actions";

export function ClientKnowledgeDeleteButton({
  id,
  clientId,
}: {
  id: string;
  clientId: string;
}) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Eliminar esta nota da base de conhecimento do cliente?")) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteClientKnowledgeEntryAction} onSubmit={confirmDelete}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 aria-hidden="true" /> Eliminar
      </Button>
    </form>
  );
}
