import Link from "next/link";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProspectForm } from "@/features/prospects/components/prospect-form";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Novo prospect | LandingForge", robots: { index: false, follow: false } };

export default async function NewProspectPage() {
  await requirePermission(permissions.prospectsWrite);
  return <div className="grid max-w-4xl gap-5"><Link href="/prospects" className="text-primary text-sm underline-offset-4 hover:underline">← Voltar a prospects</Link><CmsPageHeader eyebrow="Registo manual" title="Novo prospect" description="Guarda apenas dados profissionais necessários e uma fonte pública verificável." /><ProspectForm /></div>;
}
