"use client";

import type { FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteProspectAction } from "@/features/prospects/actions/prospect.actions";

export function DeleteProspectButton({ id }: { id: string }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Eliminar definitivamente este prospect e os rascunhos associados? A lista global de supressão será preservada.")) {
      event.preventDefault();
    }
  }

  return <form action={deleteProspectAction} onSubmit={confirmDelete}>
    <input type="hidden" name="id" value={id} />
    <Button type="submit" variant="destructive"><Trash2 aria-hidden="true" /> Eliminar prospect</Button>
  </form>;
}
