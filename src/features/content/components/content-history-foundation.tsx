import { Alert } from "@/components/ui/feedback";

export function ContentHistoryFoundation() {
  return (
    <Alert tone="info" title="Histórico de alterações">
      As alterações ao conteúdo ficam registadas na auditoria. O histórico de
      versões completo, a reposição e a comparação lado a lado pertencem à tarefa
      de versionamento.
    </Alert>
  );
}
