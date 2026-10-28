import Link from "next/link";

import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { provisionProjectSourceAction } from "@/features/projects/actions/project.actions";

type ProvisioningPage = { id: string; title: string; slug: string; status: string } | null;
type SourceVersion = {
  version: number;
  templateVersion: string;
  checksum: string;
  createdAt: Date;
} | null;

export function ProjectProvisioningPanel({
  projectId,
  templateName,
  variantName,
  page,
  sourceVersion,
  canWrite,
  canEditPages,
}: {
  projectId: string;
  templateName: string | null;
  variantName: string | null;
  page: ProvisioningPage;
  sourceVersion: SourceVersion;
  canWrite: boolean;
  canEditPages: boolean;
}) {
  return (
    <section className="border-border grid gap-4 rounded-md border p-5">
      <div>
        <h2 className="font-semibold">Cópia privada do template</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {templateName && variantName
            ? `${templateName} · ${variantName}`
            : "Seleciona um template e uma variante no projeto para continuar."}
        </p>
      </div>
      {page ? (
        <div className="grid gap-3">
          <Alert tone="success" title="Cópia criada em rascunho">
            A demo oficial ficou intacta. Os formulários estão inativos e a página não é indexável.
          </Alert>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Página</dt><dd>{page.title}</dd></div>
            <div><dt className="text-muted-foreground">Estado</dt><dd>{page.status === "DRAFT" ? "Rascunho" : page.status}</dd></div>
            {sourceVersion ? (
              <>
                <div><dt className="text-muted-foreground">Versão de origem</dt><dd>{sourceVersion.templateVersion} · v{sourceVersion.version}</dd></div>
                <div><dt className="text-muted-foreground">Checksum</dt><dd className="break-all font-mono text-xs">{sourceVersion.checksum}</dd></div>
              </>
            ) : null}
          </dl>
          {canEditPages ? (
            <div><Link className="text-primary text-sm underline-offset-4 hover:underline" href={`/pages/${page.id}/edit`}>Abrir no CMS interno</Link></div>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Esta cópia é uma fonte privada no LandingForge; ainda não é um pacote de entrega nem um CMS isolado para o cliente.
          </p>
        </div>
      ) : canWrite && templateName && variantName ? (
        <ActionFeedbackForm
          action={provisionProjectSourceAction}
          className="grid justify-items-start gap-3"
          loadingMessage="A criar cópia privada…"
          successMessage="Cópia privada criada."
          errorMessage="Não foi possível criar a cópia privada."
        >
          <input name="id" type="hidden" value={projectId} />
          <Button type="submit">Criar cópia privada</Button>
          <p className="text-muted-foreground text-xs">
            Usa apenas uma demo publicada e aprovada da variante. A cópia começa em rascunho; os formulários não recebem leads até serem configurados e ativados.
          </p>
        </ActionFeedbackForm>
      ) : (
        <Alert tone="info" title="Provisionamento indisponível">
          A operação exige um template e uma variante selecionados e permissão para editar projetos.
        </Alert>
      )}
    </section>
  );
}
