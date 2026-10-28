import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Alert } from "@/components/ui/feedback";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProspectComposer } from "@/features/prospects/components/prospect-composer";
import { getApprovedProspectDemos, getProspectDetail, listProspectTemplates } from "@/features/prospects/services/prospect.service";
import { ProspectStatus } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Preparar contacto | LandingForge", robots: { index: false, follow: false } };

export default async function ProspectOutreachPage({ params, searchParams }: { params: Promise<{ prospectId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission(permissions.prospectsWrite);
  const [{ prospectId }, query] = await Promise.all([params, searchParams]);
  const [prospect, templates, demos] = await Promise.all([getProspectDetail(prospectId), listProspectTemplates(), getApprovedProspectDemos()]);
  if (!prospect) notFound();
  if (!prospect.email || prospect.status === ProspectStatus.DO_NOT_CONTACT || prospect.status === ProspectStatus.NOT_INTERESTED || prospect.status === ProspectStatus.CONVERTED || prospect.status === ProspectStatus.ARCHIVED) redirect(`/prospects/${prospect.id}`);
  const selectedId = Array.isArray(query.template) ? query.template[0] : query.template;
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];
  const version = selected?.versions[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return <div className="grid max-w-5xl gap-5">
    <Link href={`/prospects/${prospect.id}`} className="text-primary text-sm underline">← Voltar à ficha</Link>
    <CmsPageHeader eyebrow="Contacto individual · rascunho" title={`Preparar mensagem para ${prospect.businessName}`} description="Edita o assunto e todo o corpo. O sistema não envia emails; a revisão humana é obrigatória antes de copiar para outro canal." />
    <Alert tone="warning" title="Gate de utilização real">Confirma a origem e atualidade dos dados e a adequação legal/comercial antes de qualquer envio manual. Sem revisão profissional, usa apenas dados de teste.</Alert>
    <ProspectComposer prospectId={prospect.id} recipient={prospect.email} fields={{ businessName: prospect.businessName, contactName: prospect.contactName ?? "", locality: prospect.locality ?? "", industry: prospect.industry ?? "", website: prospect.website ?? "" }} templateId={selected?.id ?? ""} subject={version?.subject ?? ""} body={version?.body ?? ""} templates={templates.map((template) => ({ id: template.id, name: template.name, version: template.versions[0]?.version ?? 0 }))} demos={demos} siteUrl={siteUrl} />
  </div>;
}
