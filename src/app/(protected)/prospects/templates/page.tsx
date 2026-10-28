import Link from "next/link";

import { Alert } from "@/components/ui/feedback";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProspectTemplateForm } from "@/features/prospects/components/prospect-template-form";
import { listProspectTemplates } from "@/features/prospects/services/prospect.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Modelos de prospeção | LandingForge", robots: { index: false, follow: false } };

export default async function ProspectTemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission(permissions.prospectsWrite);
  const [params, templates] = await Promise.all([searchParams, listProspectTemplates()]);
  const first = Array.isArray(params.template) ? params.template[0] : params.template;
  const selected = templates.find((template) => template.id === first);
  return <div className="grid gap-6">
    <Link href="/prospects" className="text-primary text-sm underline-offset-4 hover:underline">← Voltar a prospects</Link>
    <CmsPageHeader eyebrow="Modelos editáveis e versionados" title="Modelos de email" description="Mantém mensagens em texto simples. Cada alteração relevante cria uma versão; cada rascunho guarda o snapshot usado." />
    <Alert tone="warning" title="Sem envio via sistema">Os modelos servem para preparar rascunhos para revisão e cópia manual. A configuração Resend transacional não é reutilizada para prospeção.</Alert>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <section className="grid content-start gap-3" aria-label="Modelos existentes"><h2 className="font-semibold">Modelos existentes ({templates.length})</h2>{templates.length ? templates.map((template) => <article key={template.id} className="border-border grid gap-2 rounded-md border p-4"><h3 className="font-semibold">{template.name}</h3><p className="text-muted-foreground text-sm">{template.industry || "Todos os nichos"} · {template.purpose}</p><p className="text-sm">Versão {template.versions[0]?.version ?? 0} · {template.versions[0]?.subject}</p><Link className="text-primary text-sm underline" href={`/prospects/templates?template=${template.id}`}>Editar modelo</Link></article>) : <p className="text-muted-foreground text-sm">Ainda não existem modelos.</p>}<Link className="text-primary text-sm underline" href="/prospects/templates">Criar novo modelo</Link></section>
      <section><h2 className="mb-3 font-semibold">{selected ? "Editar modelo / criar versão" : "Novo modelo"}</h2><ProspectTemplateForm template={selected} /></section>
    </div>
  </div>;
}
