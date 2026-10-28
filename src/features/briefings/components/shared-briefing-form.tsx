"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  approveSharedBriefingAction,
  submitSharedBriefingAction,
  type SharedBriefingActionState,
} from "@/features/briefings/actions/briefing.actions";
import type { BriefingQuestion } from "@/features/briefings/briefing-questions";

const initial: SharedBriefingActionState = {};

export function SharedBriefingForm({
  token,
  expectedVersion,
  questions,
  answers,
  submittedByName,
  previewChecksum,
  releasePackage,
  businessName,
  projectName,
}: {
  token: string;
  expectedVersion: number;
  questions: BriefingQuestion[];
  answers: Record<string, string>;
  submittedByName?: string;
  previewChecksum?: string;
  releasePackage?: {
    checksum: string;
    mode: string;
    templateVersion: string;
  };
  businessName: string;
  projectName: string;
}) {
  const [printView, setPrintView] = useState(false);
  const [state, action, pending] = useActionState(
    submitSharedBriefingAction,
    initial,
  );
  const [approval, approve, approvalPending] = useActionState(
    approveSharedBriefingAction,
    initial,
  );
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

  if (state.success)
    return (
      <div
        className="border-border bg-success/5 rounded-md border p-5"
        role="status"
      >
        <h2 className="font-semibold">Respostas enviadas</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          A nova revisão foi guardada. A equipa do projeto irá analisá-la.
        </p>
      </div>
    );
  if (approval.success)
    return (
      <div
        className="border-border bg-success/5 rounded-md border p-5"
        role="status"
      >
        <h2 className="font-semibold">Decisão registada</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          A decisão ficou associada à revisão {expectedVersion}. Podes fechar
          esta página.
        </p>
      </div>
    );

  if (printView) {
    return (
      <section className="briefing-print-document grid gap-6">
        <div className="print:hidden flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.print()}>
            Imprimir ou guardar como PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPrintView(false)}
          >
            Voltar ao briefing
          </Button>
        </div>
        <header className="grid gap-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            LandingForge · formulário de briefing
          </p>
          <h1 className="text-2xl font-semibold">{businessName}</h1>
          <p>Projeto: {projectName}</p>
          <p className="text-muted-foreground text-sm">
            Preencha apenas a informação necessária. Não inclua palavras-passe,
            dados de pagamento ou informação clínica/de saúde.
          </p>
        </header>
        {[...grouped.entries()].map(([group, items]) => (
          <section key={group} className="grid gap-4">
            <h2 className="border-border border-b pb-2 text-lg font-semibold">
              {group}
            </h2>
            {items.map((question) => (
              <div key={question.key} className="grid gap-2 break-inside-avoid">
                <h3 className="text-sm font-medium">{question.label}</h3>
                {question.helpText ? (
                  <p className="text-muted-foreground text-xs">
                    {question.helpText}
                  </p>
                ) : null}
                {question.options ? (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <li key={option} className="text-sm">
                        [ ] {option}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    aria-hidden="true"
                    className="border-border h-20 border-b"
                  />
                )}
              </div>
            ))}
          </section>
        ))}
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-muted-foreground text-sm">
          Pode preencher este formulário online ou preparar uma cópia vazia.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrintView(true)}
        >
          Preparar formulário vazio
        </Button>
      </div>
      <form action={action} className="grid gap-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="expectedVersion" value={expectedVersion} />
        <Field>
          <Label htmlFor="shared-briefing-name">
            Nome da pessoa de contacto
          </Label>
          <Input
            id="shared-briefing-name"
            name="submittedByName"
            required
            minLength={2}
            maxLength={120}
            defaultValue={submittedByName ?? ""}
          />
        </Field>
        {[...grouped.entries()].map(([group, items]) => (
          <fieldset
            key={group}
            className="border-border grid gap-4 border-t pt-4 first:border-0 first:pt-0"
          >
            <legend className="px-1 font-semibold">{group}</legend>
            {items.map((question) => (
              <Field key={question.key}>
                <Label htmlFor={`shared-${question.key}`}>
                  {question.label}
                </Label>
                {question.options ? (
                  <Select
                    id={`shared-${question.key}`}
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
                    id={`shared-${question.key}`}
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
            ))}
          </fieldset>
        ))}
        {state.error ? (
          <p className="text-error text-sm" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" isLoading={pending}>
          Enviar respostas como nova revisão
        </Button>
      </form>

      {expectedVersion > 0 ? (
        <section
          className="border-border grid gap-3 border-t pt-6"
          aria-labelledby="approval-heading"
        >
          <div>
            <h2 id="approval-heading" className="font-semibold">
              Confirmar uma decisão
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A confirmação aplica-se apenas à revisão atual. Se enviares novas
              respostas, será criada uma nova revisão que necessita de nova
              aprovação.
            </p>
          </div>
          <form action={approve} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="expectedVersion"
              value={expectedVersion}
            />
            {previewChecksum ? (
              <input
                type="hidden"
                name="expectedPreviewChecksum"
                value={previewChecksum}
              />
            ) : null}
            {releasePackage ? (
              <input
                type="hidden"
                name="expectedReleaseChecksum"
                value={releasePackage.checksum}
              />
            ) : null}
            <Field>
              <Label htmlFor="approval-name">Nome</Label>
              <Input
                id="approval-name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={submittedByName ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="approval-type">O que está a confirmar?</Label>
              <Select id="approval-type" name="type" defaultValue="SCOPE">
                <option value="SCOPE">Âmbito e requisitos</option>
                <option value="CONTENT">Conteúdos fornecidos</option>
                {previewChecksum ? (
                  <option value="DESIGN">Design e preview da landing</option>
                ) : null}
                {releasePackage ? (
                  <option value="RELEASE">Pacote final para publicação</option>
                ) : null}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="approval-decision">Decisão</Label>
              <Select
                id="approval-decision"
                name="decision"
                defaultValue="APPROVED"
              >
                <option value="APPROVED">Aprovar</option>
                <option value="REVISION_REQUESTED">Pedir alterações</option>
                <option value="REJECTED">Não aprovar</option>
              </Select>
            </Field>
            {releasePackage ? (
              <p className="text-muted-foreground text-xs sm:col-span-2">
                A aprovação de release identifica o pacote {releasePackage.mode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing Only"} ({releasePackage.templateVersion}) pelo SHA-256 do artefacto e pelo checksum do preview. O nome é declarado por quem usa a ligação; não é verificação de identidade nem assinatura digital.
              </p>
            ) : previewChecksum ? (
              <p className="text-muted-foreground text-xs sm:col-span-2">
                A decisão de design fica ligada ao SHA-256 apresentado no
                preview. O nome é declarado por quem usa a ligação; não é uma
                verificação de identidade nem uma assinatura digital.
              </p>
            ) : null}
            <Field>
              <Label htmlFor="approval-comment">Comentário (opcional)</Label>
              <Input id="approval-comment" name="comment" maxLength={1500} />
            </Field>
            {approval.error ? (
              <p className="text-error text-sm sm:col-span-2" role="alert">
                {approval.error}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button
                variant="outline"
                type="submit"
                isLoading={approvalPending}
              >
                Registar decisão da revisão {expectedVersion}
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
