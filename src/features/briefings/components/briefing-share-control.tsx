"use client";

import { Copy, Link2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form";
import { createBriefingShareAction } from "@/features/briefings/actions/briefing.actions";

export function BriefingShareControl({
  projectId,
  exports,
}: {
  projectId: string;
  exports: Array<{
    id: string;
    mode: string;
    templateVersion: string;
    artifactChecksum: string | null;
    expiresAt: Date;
  }>;
}) {
  const [share, setShare] = useState<{
    url: string;
    expiresAt: string;
    releaseChecksum: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <form
        action={(formData) =>
          startTransition(async () => {
            setError(null);
            try {
              setShare(await createBriefingShareAction(formData));
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível criar a ligação.",
              );
            }
          })
        }
      >
        <input type="hidden" name="projectId" value={projectId} />
        <div className="mb-3 grid gap-2">
          <Label htmlFor={`briefing-release-export-${projectId}`}>
            Exportação para aprovação de release (opcional)
          </Label>
          <Select
            id={`briefing-release-export-${projectId}`}
            name="releaseExportId"
            defaultValue=""
            disabled={!exports.length}
          >
            <option value="">Apenas briefing e aprovação de design</option>
            {exports.map((item) => (
              <option key={item.id} value={item.id}>
                {item.mode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing Only"} · {item.templateVersion}
              </option>
            ))}
          </Select>
          <p className="text-muted-foreground text-xs">
            Só são listados pacotes prontos que correspondem ao preview atual.
          </p>
        </div>
        <Button type="submit" variant="outline" isLoading={pending}>
          <Link2 aria-hidden="true" /> Criar ligação segura
        </Button>
      </form>
      {share ? (
        <div className="border-border bg-muted/30 grid gap-2 rounded-md border p-3">
          <label
            className="text-sm font-medium"
            htmlFor={`briefing-share-${projectId}`}
          >
            Ligação válida até{" "}
            {new Date(share.expiresAt).toLocaleString("pt-PT")}
          </label>
          <p className="text-muted-foreground text-xs">
            {share.releaseChecksum
              ? `Inclui aprovação do pacote · SHA-256 ${share.releaseChecksum}`
              : "Inclui revisão do briefing e do preview; sem aprovação de pacote."}
          </p>
          <div className="flex gap-2">
            <input
              id={`briefing-share-${projectId}`}
              readOnly
              value={share.url}
              className="border-input bg-background min-w-0 flex-1 rounded-md border px-3 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Copiar ligação"
              aria-label="Copiar ligação"
              onClick={() => void navigator.clipboard.writeText(share.url)}
            >
              <Copy aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        A ligação dá acesso apenas a este briefing e expira ao fim de 7 dias.
        Criar outra revoga a anterior.
      </p>
    </div>
  );
}
