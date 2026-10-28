"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Checkbox } from "@/components/ui/form";
import { markProspectDraftExportedAction } from "@/features/prospects/actions/prospect.actions";
import { useToast } from "@/components/ui/action-feedback";

export function CopyProspectDraft({ draftId, recipient, subject, body }: { draftId: string; recipient: string | null; subject: string; body: string }) {
  const [confirmed, setConfirmed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { showToast } = useToast();
  const copy = () => {
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("draftId", draftId);
    formData.set("confirmed", "yes");
    startTransition(async () => {
      try {
        const result = await markProspectDraftExportedAction(formData);
        if (!result.ok) {
          showToast({ tone: "error", title: result.message });
          return;
        }
        await navigator.clipboard.writeText(`Para: ${result.recipient ?? recipient ?? ""}\nAssunto: ${result.subject || subject}\n\n${result.body || body}`);
        showToast({ tone: "success", title: "Rascunho copiado e ação registada." });
      } catch {
        showToast({ tone: "error", title: "Não foi possível copiar a mensagem. Verifica as permissões da área de transferência e tenta novamente." });
      }
    });
  };
  return <div className="grid gap-3">
    <Field className="flex items-start gap-3"><Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span className="text-sm">Confirmo que revi o destinatário, a origem dos dados, o conteúdo, as afirmações comerciais e a adequação antes de qualquer envio manual.</span></Field>
    <Button type="button" variant="outline" disabled={!confirmed || pending} onClick={copy}>{pending ? "A copiar…" : "Copiar mensagem completa"}</Button>
  </div>;
}
