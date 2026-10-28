import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Table } from "@/components/ui/data-display";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { suppressProspectAction } from "@/features/prospects/actions/prospect.actions";
import { getProspectSuppressions } from "@/features/prospects/services/prospect.service";
import { ProspectSuppressionType } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Supressões de contacto | LandingForge", robots: { index: false, follow: false } };

export default async function ProspectSuppressionsPage() {
  await requirePermission(permissions.prospectsWrite);
  const suppressions = await getProspectSuppressions();
  return <div className="grid gap-5">
    <Link href="/prospects" className="text-primary text-sm underline">← Voltar a prospects</Link>
    <CmsPageHeader eyebrow="Controlo global" title="Não contactar" description="Cada entrada é aplicada à importação, preparação e cópia de mensagens e propaga-se aos registos conhecidos." />
    <Alert tone="warning" title="Supressão deliberadamente persistente">Não existe remoção rápida. Corrigir uma entrada requer revisão explícita e auditada, que será acrescentada após definição do processo de verificação de oposição.</Alert>
    <Card><Stack><h2 className="font-semibold">Adicionar à lista global</h2><form action={suppressProspectAction} className="grid gap-4 sm:grid-cols-3"><Field><Label htmlFor="type">Tipo</Label><Select id="type" name="type"><option value={ProspectSuppressionType.EMAIL}>Email</option><option value={ProspectSuppressionType.DOMAIN}>Domínio empresarial</option></Select></Field><Field><Label htmlFor="value">Email ou domínio</Label><Input id="value" name="value" required maxLength={254} /></Field><Field><Label htmlFor="reason">Motivo operacional</Label><Input id="reason" name="reason" required maxLength={300} defaultValue="Pedido de não contacto" /></Field><div className="sm:col-span-3"><Button variant="destructive">Adicionar supressão</Button></div></form></Stack></Card>
    {suppressions.length ? <Table caption="Lista global de supressão"><thead className="border-border border-b text-left text-xs uppercase"><tr><th scope="col" className="px-3 py-2">Tipo</th><th scope="col" className="px-3 py-2">Valor</th><th scope="col" className="px-3 py-2">Motivo</th><th scope="col" className="px-3 py-2">Registado</th></tr></thead><tbody>{suppressions.map((item) => <tr key={item.id} className="border-border border-b last:border-0"><td className="px-3 py-3">{item.type === ProspectSuppressionType.EMAIL ? "Email" : "Domínio"}</td><td className="px-3 py-3">{item.value}</td><td className="px-3 py-3">{item.reason}</td><td className="px-3 py-3">{item.createdAt.toLocaleDateString("pt-PT")}</td></tr>)}</tbody></Table> : <p className="text-muted-foreground text-sm">A lista ainda está vazia.</p>}
  </div>;
}
