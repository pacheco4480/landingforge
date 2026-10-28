"use client";

import { Copy, FileOutput } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form";
import { generateProjectAiContextAction } from "@/features/briefings/actions/briefing.actions";
import type { BriefingQuestion } from "@/features/briefings/briefing-questions";

export function BriefingAiContextForm({
  projectId,
  questions,
  answers,
}: {
  projectId: string;
  questions: BriefingQuestion[];
  answers: Record<string, string>;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const available = questions.filter(({ key }) =>
    Boolean(answers[key]?.trim()),
  );

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          try {
            const result = await generateProjectAiContextAction(formData);
            setContent(result.content);
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Não foi possível preparar o contexto.",
            );
          }
        })
      }
      className="grid gap-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <Field>
        <Label htmlFor={`ai-purpose-${projectId}`}>Finalidade</Label>
        <Input
          id={`ai-purpose-${projectId}`}
          name="purpose"
          required
          maxLength={500}
          placeholder="Ex.: preparar uma primeira proposta de copy"
        />
      </Field>
      <Field>
        <Label htmlFor={`ai-format-${projectId}`}>Formato</Label>
        <Select
          id={`ai-format-${projectId}`}
          name="format"
          defaultValue="markdown"
        >
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </Select>
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Respostas a incluir</legend>
        {available.length ? (
          available.map((question) => (
            <label
              key={question.key}
              className="flex items-start gap-2 text-sm"
            >
              <Checkbox name="selectedFields" value={question.key} />
              <span>{question.label}</span>
            </label>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            Guarda respostas no briefing antes de gerar contexto.
          </p>
        )}
      </fieldset>
      <p className="text-muted-foreground text-xs">
        A geração é manual. O conteúdo é revisto aqui, não é enviado
        automaticamente a qualquer fornecedor, e as notas internas não são
        incluídas.
      </p>
      <div>
        <Button type="submit" isLoading={pending} disabled={!available.length}>
          <FileOutput aria-hidden="true" /> Gerar para revisão
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      ) : null}
      {content ? (
        <Field>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`ai-result-${projectId}`}>Contexto gerado</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(content)}
            >
              <Copy aria-hidden="true" /> Copiar
            </Button>
          </div>
          <Textarea
            id={`ai-result-${projectId}`}
            readOnly
            value={content}
            className="min-h-72 font-mono text-xs"
          />
        </Field>
      ) : null}
    </form>
  );
}
