"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Label, Select, Textarea, Input } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";
import { saveProspectDraftAction } from "@/features/prospects/actions/prospect.actions";
import { renderProspectTemplate, findTemplatePlaceholders } from "@/features/prospects/prospect-utils";

type TemplateOption = { id: string; name: string; version: number };
type DemoOption = { slug: string; title: string };
type Fields = { businessName: string; contactName: string; locality: string; industry: string; website: string };

export function ProspectComposer({ prospectId, recipient, fields, templateId, subject: initialSubject, body: initialBody, templates, demos, siteUrl }: {
  prospectId: string; recipient: string; fields: Fields; templateId: string; subject: string; body: string;
  templates: TemplateOption[]; demos: DemoOption[]; siteUrl: string;
}) {
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState(initialBody);
  const [publicDemoSlug, setPublicDemoSlug] = React.useState("");
  const demoUrl = publicDemoSlug ? `${siteUrl.replace(/\/$/, "")}/templates/${publicDemoSlug}` : "";
  const renderedSubject = renderProspectTemplate(subject, { ...fields, publicDemoUrl: demoUrl });
  const renderedBody = renderProspectTemplate(body, { ...fields, publicDemoUrl: demoUrl });
  const unresolved = [...findTemplatePlaceholders(renderedSubject), ...findTemplatePlaceholders(renderedBody)];
  const unsupported = unresolved.filter((item) => !["businessName", "contactName", "locality", "industry", "website", "publicDemoUrl"].includes(item));

  return <form action={saveProspectDraftAction} className="grid gap-5">
    <input type="hidden" name="prospectId" value={prospectId} />
    <input type="hidden" name="templateId" value={templateId} />
    <input type="hidden" name="publicDemoSlug" value={publicDemoSlug} />
    <Card><Stack>
      <Field><Label htmlFor="recipient">Destinatário</Label><Input id="recipient" type="email" readOnly value={recipient} /></Field>
      <Field><Label htmlFor="subject">Assunto editável</Label><Input id="subject" name="subject" required maxLength={300} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
      <Field><Label htmlFor="body">Mensagem editável (texto simples)</Label><Textarea id="body" name="body" required maxLength={12000} className="min-h-64" value={body} onChange={(event) => setBody(event.target.value)} /></Field>
      <Field><Label htmlFor="demo">Demo pública (opcional)</Label><Select id="demo" value={publicDemoSlug} onChange={(event) => setPublicDemoSlug(event.target.value)}><option value="">Não incluir demo</option>{demos.map((demo) => <option key={demo.slug} value={demo.slug}>{demo.title}</option>)}</Select><p className="text-muted-foreground text-sm">Só aparecem páginas aprovadas e visíveis no portfolio público. Nunca é usada uma rota interna.</p></Field>
      {templates.length ? <p className="text-muted-foreground text-sm">Modelos disponíveis: {templates.map((template) => `${template.name} v${template.version}`).join(" · ")}</p> : null}
      {unresolved.length || unsupported.length ? <p className="text-warning text-sm" role="status">Preview com campos por resolver: {unresolved.join(", ") || "—"}. Podes guardar o rascunho; a cópia fica bloqueada até os resolveres.</p> : null}
      {unsupported.length ? <p className="text-error text-sm" role="alert">Placeholders não suportados: {unsupported.join(", ")}. Remove-os antes de guardar.</p> : null}
      <Button type="submit" disabled={unsupported.length > 0}>Guardar rascunho</Button>
    </Stack></Card>
    <Card><Stack><h2 className="text-base font-semibold">Pré-visualização final</h2><p className="text-muted-foreground text-sm">Para: {recipient}</p><p className="font-semibold">Assunto: {renderedSubject}</p><pre className="bg-muted overflow-x-auto whitespace-pre-wrap rounded-md p-4 text-sm">{renderedBody}</pre></Stack></Card>
  </form>;
}
