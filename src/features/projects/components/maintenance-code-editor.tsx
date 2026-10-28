"use client";

import { useMemo, useState } from "react";

import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Label, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { saveMaintenanceCodeChangeAction } from "@/features/projects/actions/project-maintenance.actions";

type SourceFile = {
  sourcePath: string;
  packagePath: string;
  content: string;
  currentContent: string;
  changed: boolean;
  stale: boolean;
  orphaned: boolean;
};

export function MaintenanceCodeEditor({
  projectId,
  releaseId,
  editable,
  files,
}: {
  projectId: string;
  releaseId: string;
  editable: boolean;
  files: SourceFile[];
}) {
  const [selectedPath, setSelectedPath] = useState(files[0]?.sourcePath ?? "");
  const selected = files.find((file) => file.sourcePath === selectedPath);
  const [content, setContent] = useState(selected?.currentContent ?? "");
  const diff = useMemo(() => {
    if (!selected) return { added: [] as string[], removed: [] as string[], addedCount: 0, removedCount: 0 };
    const before = selected.content.split(/\r?\n/);
    const after = content.split(/\r?\n/);
    let prefix = 0;
    while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
    let suffix = 0;
    while (prefix + suffix < before.length && prefix + suffix < after.length && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix += 1;
    const removed = before.slice(prefix, before.length - suffix);
    const added = after.slice(prefix, after.length - suffix);
    return {
      added: added.slice(0, 80),
      removed: removed.slice(0, 80),
      addedCount: added.length,
      removedCount: removed.length,
    };
  }, [content, selected]);

  function chooseSource(path: string) {
    setSelectedPath(path);
    const file = files.find((item) => item.sourcePath === path);
    setContent(file?.currentContent ?? "");
  }

  if (!files.length) {
    return <Alert tone="warning" title="Sem ficheiros estruturais editáveis">Esta variante não tem ficheiros específicos aprovados para alteração isolada.</Alert>;
  }

  return (
    <section aria-labelledby={`code-maintenance-${releaseId}`} className="grid gap-3">
      <div>
        <h2 id={`code-maintenance-${releaseId}`} className="text-lg font-semibold">Alteração estrutural isolada</h2>
        <p className="text-muted-foreground mt-1 text-sm">Edita apenas fontes existentes e específicas desta variante. A proposta é guardada nesta candidata; não altera o template oficial nem cria ficheiros.</p>
      </div>
      <Alert tone="warning" title="Revisão e build obrigatórios">
        O código proposto só pode ser publicado depois de build e auditoria do pacote. Limites: 12 ficheiros, 100 KB por ficheiro e 300 KB no total. Ficheiros partilhados, configuração de deployment, credenciais e novos ficheiros não são editáveis aqui.
      </Alert>
      {files.some((file) => file.stale) ? <Alert tone="error" title="A fonte oficial mudou">Um ou mais patches usam uma base antiga. Revisa-os e guarda novamente antes de validar.</Alert> : null}
      <Field>
        <Label htmlFor={`code-source-${releaseId}`}>Ficheiro da variante</Label>
        <Select id={`code-source-${releaseId}`} value={selectedPath} onChange={(event) => chooseSource(event.target.value)} disabled={!editable}>
          {files.map((file) => <option key={file.sourcePath} value={file.sourcePath}>{file.sourcePath}{file.changed ? " · alterado" : ""}</option>)}
        </Select>
      </Field>
      {selected ? (
        <>
          <p className="text-muted-foreground break-all font-mono text-xs">Destino no pacote: {selected.packagePath}</p>
          {selected.orphaned ? <Alert tone="error" title="Patch sem ficheiro de destino">A fonte foi removida da variante. Deixa o editor vazio e guarda para remover este patch obsoleto e desbloquear a validação.</Alert> : null}
          <ActionFeedbackForm
            action={saveMaintenanceCodeChangeAction}
            className="grid gap-3"
            loadingMessage="A guardar patch isolado…"
            successMessage="Patch guardado; a validação e aprovação anteriores foram invalidadas."
            errorMessage="Não foi possível guardar o patch. Confirma os limites e o ficheiro selecionado."
          >
            <input name="projectId" type="hidden" value={projectId} />
            <input name="releaseId" type="hidden" value={releaseId} />
            <input name="sourcePath" type="hidden" value={selected.sourcePath} />
            <Field>
              <Label htmlFor={`code-content-${releaseId}`}>Código completo proposto</Label>
              <Textarea
                id={`code-content-${releaseId}`}
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                readOnly={!editable}
                maxLength={100_000}
                rows={24}
                spellCheck={false}
                className="font-mono text-xs"
                aria-describedby={`code-diff-${releaseId}`}
                placeholder={selected.orphaned ? "Deixa vazio para remover o patch obsoleto." : undefined}
              />
            </Field>
            <p id={`code-diff-${releaseId}`} className="text-muted-foreground text-xs" aria-live="polite">
              Diff do primeiro bloco alterado: {diff.addedCount} linhas adicionadas e {diff.removedCount} removidas. O build isolado é a validação técnica final.
            </p>
            {diff.addedCount || diff.removedCount ? (
              <details open className="border-border rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">Rever diff da proposta</summary>
                <pre className="bg-muted mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words p-3 text-xs">{[
                  ...diff.removed.map((line) => `- ${line}`),
                  ...diff.added.map((line) => `+ ${line}`),
                  ...(diff.removedCount > 80 || diff.addedCount > 80 ? ["… diff truncado na interface; o patch integral será validado no build"] : []),
                ].join("\n")}</pre>
              </details>
            ) : null}
            {editable ? (
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={content === selected.currentContent}>Guardar patch</Button>
                {!selected.orphaned ? <Button type="button" variant="outline" onClick={() => setContent(selected.content)} disabled={content === selected.content}>Restaurar fonte oficial</Button> : null}
              </div>
            ) : null}
          </ActionFeedbackForm>
          <details className="border-border rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">Consultar fonte oficial de base</summary>
            <pre className="bg-muted mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words p-3 text-xs">{selected.content}</pre>
          </details>
        </>
      ) : null}
    </section>
  );
}
