import Link from "next/link";
import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { ClientForm } from "@/features/clients/components/client-form";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function NewClientPage() {
  const user = await requirePermission(permissions.clientsWrite);
  return (
    <div className="grid gap-6">
      <div>
        <Link className="text-primary text-sm underline-offset-4 hover:underline" href="/clients">Voltar a clientes</Link>
        <CmsPageHeader eyebrow="CRM interno" title="Novo cliente" description="Regista apenas os dados necessários para gerir a relação comercial." />
      </div>
      <ClientForm
        canEditNotes={
          user.permissions.includes(permissions.clientNotesRead) &&
          user.permissions.includes(permissions.clientNotesWrite)
        }
      />
    </div>
  );
}
