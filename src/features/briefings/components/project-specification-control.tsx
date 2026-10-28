"use client";

import { Copy, Download, FileText, Printer } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Field, Label, Select, Textarea } from "@/components/ui/form";
import { generateProjectSpecificationAction } from "@/features/briefings/actions/briefing.actions";

export function ProjectSpecificationControl({
  projectId,
}: {
  projectId: string;
}) {
  const [audience, setAudience] = useState<"internal" | "client">("internal");
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const [result, setResult] = useState<{
    content: string;
    contentHash: string;
    audience: "internal" | "client";
    format: "markdown" | "json";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(data) =>
        startTransition(async () => {
          setError(null);
          try {
            const generated = await generateProjectSpecificationAction(data);
            setResult({ ...generated, audience, format });
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Não foi possível gerar a especificação.",
            );
          }
        })
      }
      className="grid gap-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`spec-audience-${projectId}`}>Versão</Label>
          <Select
            id={`spec-audience-${projectId}`}
            name="audience"
            value={audience}
            disabled={pending}
            onChange={(event) => {
              setAudience(event.target.value as "internal" | "client");
              setResult(null);
            }}
          >
            <option value="internal">Especificação interna</option>
            <option value="client">Cópia partilhável</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor={`spec-format-${projectId}`}>Formato</Label>
          <Select
            id={`spec-format-${projectId}`}
            name="format"
            value={format}
            disabled={pending}
            onChange={(event) => {
              setFormat(event.target.value as "markdown" | "json");
              setResult(null);
            }}
          >
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </Select>
        </Field>
      </div>
      <p className="text-muted-foreground text-xs">
        A versão partilhável omite detalhes operacionais internos. O PDF do
        servidor fica associado à pré-visualização e exige nova geração se os
        dados mudarem. Não é um contrato nem um documento assinado.
      </p>
      <div>
        <Button type="submit" isLoading={pending}>
          <FileText aria-hidden="true" /> Gerar especificação
        </Button>
      </div>
      {error ? (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="project-specification-print grid gap-3">
          {result.format === "json" ? (
            <p className="text-muted-foreground text-sm" role="status">
              Para descarregar um PDF paginado, gera a especificação em
              Markdown.
            </p>
          ) : null}
          <Field>
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <Label htmlFor={`spec-result-${projectId}`}>
                Pré-visualização
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void navigator.clipboard.writeText(result.content)
                  }
                >
                  <Copy aria-hidden="true" /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer aria-hidden="true" /> Imprimir / Guardar como PDF
                </Button>
                {result.format === "markdown" ? (
                  <a
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`/api/projects/${projectId}/specification.pdf?audience=${result.audience}&contentHash=${result.contentHash}`}
                    download
                  >
                    <Download aria-hidden="true" /> Descarregar PDF
                  </a>
                ) : null}
              </div>
            </div>
            <Textarea
              id={`spec-result-${projectId}`}
              readOnly
              value={result.content}
              className="min-h-64 font-mono text-xs print:hidden"
            />
            <pre className="hidden font-mono text-xs whitespace-pre-wrap print:block">
              {result.content}
            </pre>
          </Field>
        </div>
      ) : null}
    </form>
  );
}
