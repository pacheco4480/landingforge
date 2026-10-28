import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";
import { saveProspectTemplateAction } from "@/features/prospects/actions/prospect.actions";

type TemplateValue = { id: string; name: string; industry: string | null; purpose: string; versions: { version: number; subject: string; body: string }[] };

export function ProspectTemplateForm({ template }: { template?: TemplateValue }) {
  const version = template?.versions[0];
  return <Card><ActionFeedbackForm action={saveProspectTemplateAction} className="grid gap-5" loadingMessage="A guardar modelo…" successMessage="Nova versão do modelo guardada.">
    {template ? <input type="hidden" name="id" value={template.id} /> : null}
    <Stack>
      <Field><Label htmlFor="name">Nome do modelo *</Label><Input id="name" name="name" required maxLength={120} defaultValue={template?.name ?? ""} /></Field>
      <Field><Label htmlFor="industry">Nicho (opcional)</Label><Input id="industry" name="industry" maxLength={80} defaultValue={template?.industry ?? ""} /></Field>
      <Field><Label htmlFor="purpose">Objetivo do modelo *</Label><Input id="purpose" name="purpose" required maxLength={300} defaultValue={template?.purpose ?? ""} /></Field>
      <Field><Label htmlFor="subject">Assunto *</Label><Input id="subject" name="subject" required maxLength={300} defaultValue={version?.subject ?? ""} /></Field>
      <Field><Label htmlFor="body">Corpo em texto simples *</Label><Textarea id="body" name="body" required maxLength={12000} className="min-h-64" defaultValue={version?.body ?? ""} /><p className="text-muted-foreground text-sm">Placeholders: {"{{businessName}}"}, {"{{contactName}}"}, {"{{locality}}"}, {"{{industry}}"}, {"{{website}}"}, {"{{publicDemoUrl}}"}. Só serão preenchidos dados existentes e demos públicas aprovadas.</p></Field>
      <p className="text-warning text-sm">Não incluas preços, prazos, resultados, clientes ou funcionalidades sem validação. Cada gravação cria uma nova versão quando o conteúdo muda.</p>
      <div><Button type="submit">{template ? `Guardar nova versão${version ? ` (atual: v${version.version})` : ""}` : "Criar modelo"}</Button></div>
    </Stack>
  </ActionFeedbackForm></Card>;
}
