import Link from "next/link";

import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ProspectCsvImporter } from "@/features/prospects/components/prospect-csv-importer";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const metadata = { title: "Importar prospects | LandingForge", robots: { index: false, follow: false } };

export default async function ImportProspectsPage() {
  await requirePermission(permissions.prospectsWrite);
  return <div className="grid gap-5"><Link href="/prospects" className="text-primary text-sm underline-offset-4 hover:underline">← Voltar a prospects</Link><CmsPageHeader eyebrow="Importação controlada" title="Importar CSV" description="Mapeia as colunas, revê erros, duplicados e supressões antes de gravar qualquer registo." /><ProspectCsvImporter /></div>;
}
