"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExportHistoryItem = {
  id: string;
  status: "READY" | "BLOCKED" | "FAILED";
  mode: "LANDING_ONLY" | "LANDING_WITH_CMS";
  templateVersion: string;
  artifactChecksum: string | null;
  fileCount: number;
  totalBytes: number;
  downloadStartedAt: Date | null;
  failureCode: string | null;
  createdAt: Date;
  expiresAt: Date;
  auditReport: unknown;
};

function reportFindings(value: unknown) {
  if (!value || typeof value !== "object" || !("findings" in value) || !Array.isArray(value.findings)) return [];
  return value.findings.filter((finding): finding is { code: string; message: string } =>
    Boolean(finding && typeof finding === "object" && "code" in finding && "message" in finding && typeof finding.code === "string" && typeof finding.message === "string"),
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

export function ClientPackageExportPanel({ projectId, mode, canExport, history }: {
  projectId: string;
  mode: "LANDING_ONLY" | "LANDING_WITH_CMS";
  canExport: boolean;
  history: ExportHistoryItem[];
}) {
  const router = useRouter();
  const [legalAcknowledged, setLegalAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgeLegalReview: legalAcknowledged, mode }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string; audit?: unknown } | null;
        const findings = reportFindings(result?.audit);
        setMessage(findings.length ? findings.map((finding) => finding.message).join(" ") : result?.error ?? "A exportação não foi concluída.");
        return;
      }
      const archive = await response.blob();
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "landingforge-client.zip";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Pacote validado e download iniciado. O ZIP não fica guardado no LandingForge.");
      router.refresh();
    } catch {
      setMessage("Não foi possível concluir a exportação. Verifica a ligação e tenta novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-border grid gap-4 rounded-md border p-5" aria-labelledby="package-export-title">
      <div>
        <h2 id="package-export-title" className="font-semibold">Pacote de entrega · {mode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing Only"}</h2>
        <p className="text-muted-foreground mt-1 text-sm">Gera uma aplicação independente {mode === "LANDING_WITH_CMS" ? "com CMS, autenticação e base de dados do cliente" : "sem CMS nem autenticação"}, compila-a e aplica a auditoria antes do download. O ZIP não fica guardado no LandingForge.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={legalAcknowledged} onChange={(event) => setLegalAcknowledged(event.target.checked)} className="mt-1" />
        <span>Compreendo que os avisos legais incluídos são modelos por preencher e têm de ser revistos e substituídos antes da publicação.</span>
      </label>
      <button type="button" disabled={!canExport || !legalAcknowledged || pending} onClick={generate} className="bg-primary text-primary-foreground disabled:opacity-50 w-fit rounded-md px-4 py-2 text-sm font-medium">
        {pending ? "A compilar e auditar…" : "Gerar e descarregar ZIP"}
      </button>
      {!canExport ? <p className="text-muted-foreground text-sm">O projeto tem de estar aprovado ou entregue antes da exportação.</p> : null}
      <p aria-live="polite" role={message && /não foi|não consegue|bloquead|falhou|excede|inválid/i.test(message) ? "alert" : "status"} className="text-muted-foreground text-sm">{message}</p>
      {history.length ? (
        <div className="border-border border-t pt-4">
          <h3 className="text-sm font-medium">Histórico recente</h3>
          <ul className="mt-2 grid gap-3">
            {history.map((item) => (
              <li key={item.id} className="text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span>{item.status === "READY" ? "Download iniciado" : item.status === "BLOCKED" ? "Exportação bloqueada" : "Falha na exportação"} · {item.mode === "LANDING_WITH_CMS" ? "Landing + CMS" : "Landing Only"} · {formatDate(item.createdAt)}</span>
                  <span className="text-muted-foreground text-xs">Expira {formatDate(item.expiresAt)}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{item.templateVersion} · {item.fileCount} ficheiros · {formatBytes(item.totalBytes)}{item.failureCode ? ` · ${item.failureCode}` : ""}</p>
                {item.artifactChecksum ? <p className="text-muted-foreground break-all font-mono text-xs">SHA-256: {item.artifactChecksum}</p> : null}
                {reportFindings(item.auditReport).length ? <ul className="mt-1 list-inside list-disc text-xs">{reportFindings(item.auditReport).slice(0, 5).map((finding, index) => <li key={`${finding.code}-${index}`}>{finding.message}</li>)}</ul> : null}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 text-xs">O histórico contém apenas metadados e o relatório resumido. Expurgo automático após 90 dias; o ficheiro ZIP é temporário e não pode ser recuperado daqui.</p>
        </div>
      ) : null}
    </section>
  );
}
