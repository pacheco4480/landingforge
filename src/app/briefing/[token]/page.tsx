import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedBriefingForm } from "@/features/briefings/components/shared-briefing-form";
import { getBriefingByShareToken } from "@/features/briefings/briefing.service";
import { PublicPageRenderer } from "@/features/public-renderer/components/public-page-renderer";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedBriefingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await getBriefingByShareToken(token);
  if (!shared) notFound();

  return (
    <div className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="grid gap-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            LandingForge · briefing de projeto
          </p>
          <h1 className="text-2xl font-semibold">
            {shared.project.client.businessName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Projeto: {shared.project.name}
            {shared.project.template
              ? ` · Template: ${shared.project.template.name}`
              : ""}
            {shared.project.templateVariant
              ? ` · Variante: ${shared.project.templateVariant.name}`
              : ""}
          </p>
          <p className="text-muted-foreground text-sm">
            Revisão {shared.revisionVersion} · ligação válida até{" "}
            {new Date(shared.expiresAt).toLocaleDateString("pt-PT")}.
          </p>
        </header>
        {shared.previewContext && shared.previewChecksum ? (
          <section
            className="border-border overflow-hidden rounded-md border"
            aria-labelledby="landing-preview-title"
          >
            <div className="bg-muted/40 grid gap-2 border-b p-4">
              <h2 id="landing-preview-title" className="font-semibold">
                Pré-visualização da landing
              </h2>
              <p className="text-muted-foreground text-sm">
                Esta versão é uma cópia de revisão. Os formulários e a gestão de
                consentimento estão desativados; a ligação não dá acesso ao CMS.
              </p>
              <p className="text-muted-foreground break-all font-mono text-xs">
                SHA-256 do conteúdo: {shared.previewChecksum}
              </p>
              {shared.releasePackage ? (
                <div className="border-border grid gap-1 border-t pt-3 text-xs">
                  <p className="font-medium">
                    Pacote associado: {shared.releasePackage.mode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing Only"} · {shared.releasePackage.templateVersion}
                  </p>
                  <p className="text-muted-foreground break-all font-mono">
                    SHA-256 do pacote: {shared.releasePackage.checksum}
                  </p>
                  <p className="text-muted-foreground">
                    Esta aprovação regista a decisão sobre este artefacto exato; a ligação não disponibiliza o ZIP nem concede acesso ao CMS.
                  </p>
                </div>
              ) : null}
            </div>
            <PublicPageRenderer context={shared.previewContext} />
          </section>
        ) : null}
        <section className="border-border grid gap-5 rounded-md border p-5">
          <div>
            <h2 className="text-lg font-semibold">Rever o briefing</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Esta ligação dá acesso apenas ao briefing deste projeto. Não
              inclui notas internas, outros projetos ou o CMS.
            </p>
          </div>
          <SharedBriefingForm
            token={token}
            expectedVersion={shared.expectedVersion}
            questions={shared.questions}
            answers={shared.answers}
            submittedByName={shared.submittedByName}
            previewChecksum={shared.previewChecksum ?? undefined}
          releasePackage={shared.releasePackage ?? undefined}
            businessName={shared.project.client.businessName}
            projectName={shared.project.name}
          />
        </section>
        <p className="text-muted-foreground text-xs">
          Não introduzas palavras-passe, dados de pagamento ou informação
          clínica/de saúde. Para invalidar esta ligação, contacta a equipa do
          projeto.
        </p>
      </div>
    </div>
  );
}
