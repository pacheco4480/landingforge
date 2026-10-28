"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Label, Select, Textarea } from "@/components/ui/form";
import { saveProjectBriefingAction } from "@/features/briefings/actions/briefing.actions";
import type { BriefingQuestion } from "@/features/briefings/briefing-questions";

export function BriefingEditorForm({
  projectId,
  initialVersion,
  questions,
  answers,
}: {
  projectId: string;
  initialVersion: number;
  questions: BriefingQuestion[];
  answers: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const versionRef = useRef(initialVersion);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveRef = useRef<() => void>(() => undefined);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState(
    initialVersion
      ? "Todas as alterações estão guardadas."
      : "Briefing ainda não guardado.",
  );
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = useCallback(() => {
    if (!dirtyRef.current) return;
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    data.set("expectedVersion", String(versionRef.current));
    queuedRef.current = false;
    inFlightRef.current = true;
    setError(null);
    setStatus("A guardar alterações...");
    startTransition(async () => {
      try {
        const result = await saveProjectBriefingAction(data);
        versionRef.current = result.version;
        setVersion(result.version);
        setStatus(`Guardado automaticamente · revisão v${result.version}`);
        if (!queuedRef.current) {
          dirtyRef.current = false;
          setIsDirty(false);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível guardar o briefing.",
        );
        setStatus("Existem alterações por guardar.");
      } finally {
        inFlightRef.current = false;
        if (queuedRef.current) window.setTimeout(() => saveRef.current(), 150);
      }
    });
  }, []);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const scheduleSave = () => {
    dirtyRef.current = true;
    setIsDirty(true);
    setStatus("Alterações por guardar…");
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveRef.current(), 1200);
  };

  const grouped = questions.reduce<Map<string, BriefingQuestion[]>>(
    (groups, question) => {
      groups.set(question.group, [
        ...(groups.get(question.group) ?? []),
        question,
      ]);
      return groups;
    },
    new Map(),
  );

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (timerRef.current) clearTimeout(timerRef.current);
        saveRef.current();
      }}
      onChange={scheduleSave}
      className="grid gap-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <p
        className="text-muted-foreground flex min-h-6 items-center gap-2 text-xs"
        role="status"
        aria-live="polite"
      >
        {isPending ? (
          <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-3" aria-hidden="true" />
        )}
        {status}
      </p>
      {[...grouped.entries()].map(([group, items]) => (
        <fieldset
          key={group}
          className="border-border grid gap-4 border-t pt-4 first:border-0 first:pt-0"
        >
          <legend className="px-1 font-semibold">{group}</legend>
          {items.map((question) => {
            const id = `${projectId}-${question.key}`;
            return (
              <Field key={question.key}>
                <Label htmlFor={id}>{question.label}</Label>
                {question.options ? (
                  <Select
                    id={id}
                    name={`answer:${question.key}`}
                    defaultValue={answers[question.key] ?? ""}
                  >
                    <option value="">Selecionar...</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Textarea
                    id={id}
                    name={`answer:${question.key}`}
                    defaultValue={answers[question.key] ?? ""}
                    maxLength={question.maxLength}
                  />
                )}
                {question.helpText ? (
                  <p className="text-muted-foreground text-xs">
                    {question.helpText}
                  </p>
                ) : null}
              </Field>
            );
          })}
        </fieldset>
      ))}
      {error ? (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          variant="outline"
          isLoading={isPending}
          disabled={!isDirty || isPending}
        >
          <Check aria-hidden="true" /> Guardar agora · v{version}
        </Button>
      </div>
    </form>
  );
}
