import Link from "next/link";
import { FileUp, Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProspectsTable } from "@/features/prospects/components/prospects-table";
import { prospectStatusLabels } from "@/features/prospects/components/prospect-form";
import { listProspects } from "@/features/prospects/services/prospect.service";
import { prospectFiltersSchema } from "@/features/prospects/schemas/prospect.schema";
import { ProspectDiscoverySearch } from "@/features/prospects/components/prospect-discovery-search";
import { resolveProspectDiscoveryProvider } from "@/features/prospects/providers/discovery-provider-resolver";
import { ProspectStatus } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Prospects | LandingForge", robots: { index: false, follow: false } };

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePermission(permissions.prospectsRead);
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const parsed = prospectFiltersSchema.safeParse({ q: first(params.q), industry: first(params.industry), locality: first(params.locality), signal: first(params.signal), status: first(params.status), page: first(params.page) });
  const filters = parsed.success ? parsed.data : { q: undefined, industry: undefined, locality: undefined, signal: undefined, status: undefined, page: 1 };
  const workspace = await listProspects(filters);
  const { prospects, total } = workspace;
  const canWrite = user.permissions.includes(permissions.prospectsWrite);
  const provider = canWrite ? resolveProspectDiscoveryProvider() : null;
  const providerUnavailableReason = provider && !provider.available ? provider.reason : null;
  const imported = first(params.imported);
  const rejected = first(params.rejected);

  return <div className="grid gap-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><CmsPageHeader eyebrow="Aquisição B2B · interno" title="Prospects" description="Organiza investigação empresarial pública e prepara contactos individuais. Não é o CRM de leads das landing pages." />
      {canWrite ? <div className="flex flex-wrap gap-2"><Link href="/prospects/suppressions"><Button variant="outline"><ShieldCheck aria-hidden="true" /> Supressões</Button></Link><Link href="/prospects/templates"><Button variant="outline">Modelos</Button></Link><Link href="/prospects/import"><Button variant="outline"><FileUp aria-hidden="true" /> Importar CSV</Button></Link><Link href="/prospects/new"><Button><Plus aria-hidden="true" /> Novo prospect</Button></Link></div> : null}
    </div>
    <Alert tone="warning" title="Envio externo desativado">A preparação de rascunhos é manual. Esta área não envia emails; cada sugestão de pesquisa, quando autorizada, exige verificação humana antes de qualquer registo.</Alert>
    {canWrite ? <ProspectDiscoverySearch availability={providerUnavailableReason} /> : null}
    {imported !== undefined ? <Alert tone="success" title="Importação concluída">{imported} registos importados. {rejected ?? "0"} linhas foram rejeitadas, duplicadas ou suprimidas; revê o relatório da pré-visualização antes de voltar a importar.</Alert> : null}
    <form method="get" className="border-border grid gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filtros de prospects">
      <label className="grid gap-1 text-sm font-medium" htmlFor="q">Pesquisa<input className="border-input bg-background min-h-11 rounded-md border px-3 font-normal" id="q" name="q" defaultValue={filters.q ?? ""} maxLength={100} /></label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="industry">Nicho<input className="border-input bg-background min-h-11 rounded-md border px-3 font-normal" id="industry" name="industry" defaultValue={filters.industry ?? ""} maxLength={80} /></label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="locality">Zona<input className="border-input bg-background min-h-11 rounded-md border px-3 font-normal" id="locality" name="locality" defaultValue={filters.locality ?? ""} maxLength={120} /></label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="signal">Sinal empresarial<select className="border-input bg-background min-h-11 rounded-md border px-3 font-normal" id="signal" name="signal" defaultValue={filters.signal ?? ""}><option value="">Todos</option>{["Sem website", "Website desatualizado", "Website não adaptado a mobile", "Falta de formulário claro", "Presença local relevante"].map((signal) => <option key={signal} value={signal}>{signal}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="status">Estado<select className="border-input bg-background min-h-11 rounded-md border px-3 font-normal" id="status" name="status" defaultValue={filters.status ?? ""}><option value="">Todos</option>{Object.values(ProspectStatus).map((status) => <option key={status} value={status}>{prospectStatusLabels[status]}</option>)}</select></label>
      <input type="hidden" name="page" value="1" /><div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4"><Button type="submit" variant="secondary">Filtrar</Button><Link className="text-primary text-sm underline-offset-4 hover:underline" href="/prospects">Limpar filtros</Link><span className="text-muted-foreground text-sm">{total} registos</span></div>
    </form>
    {!parsed.success ? <p className="text-warning text-sm" role="status">Alguns filtros inválidos foram ignorados.</p> : null}
    <ProspectsTable prospects={prospects} hasFilters={Boolean(filters.q || filters.industry || filters.locality || filters.signal || filters.status)} />
    {workspace.totalPages > 1 ? <nav className="flex items-center justify-between" aria-label="Paginação de prospects"><p className="text-muted-foreground text-sm">Página {workspace.page} de {workspace.totalPages}</p><div className="flex gap-2">{workspace.page > 1 ? <Link href={`/prospects?${new URLSearchParams({ ...(filters.q ? { q: filters.q } : {}), ...(filters.industry ? { industry: filters.industry } : {}), ...(filters.locality ? { locality: filters.locality } : {}), ...(filters.signal ? { signal: filters.signal } : {}), ...(filters.status ? { status: filters.status } : {}), page: String(workspace.page - 1) }).toString()}`} rel="prev" className="border-border rounded-md border px-3 py-2 text-sm">Anterior</Link> : null}{workspace.page < workspace.totalPages ? <Link href={`/prospects?${new URLSearchParams({ ...(filters.q ? { q: filters.q } : {}), ...(filters.industry ? { industry: filters.industry } : {}), ...(filters.locality ? { locality: filters.locality } : {}), ...(filters.signal ? { signal: filters.signal } : {}), ...(filters.status ? { status: filters.status } : {}), page: String(workspace.page + 1) }).toString()}`} rel="next" className="border-border rounded-md border px-3 py-2 text-sm">Seguinte</Link> : null}</div></nav> : null}
  </div>;
}
