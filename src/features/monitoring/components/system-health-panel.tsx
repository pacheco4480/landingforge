import type { DeploymentEnvironment, DeploymentMode } from "@/generated/prisma/client";
import { Alert, Badge } from "@/components/ui/feedback";
import { DataTable } from "@/components/ui/data-display";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";

export function SystemHealthPanel({
  deployment,
  frequentErrors,
}: {
  deployment: {
    readyComputed: boolean;
    cmsEnabled: boolean;
    mode: DeploymentMode;
    environment: DeploymentEnvironment;
    deploymentStatus: string;
    domainStatus: string;
    sslStatus: string;
    completedItems: number;
    totalItems: number;
  };
  frequentErrors: Array<{
    fingerprint: string | null;
    message: string;
    level: string;
    source: string;
    _count: { _all: number };
  }>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Estado operacional calculado a partir da configuração de deploy.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <Alert
            tone={deployment.readyComputed ? "success" : "warning"}
            title={deployment.readyComputed ? "Pronto" : "Requer configuração"}
          >
            Checklist {deployment.completedItems}/{deployment.totalItems}
          </Alert>
          <p>
            Ambiente: <Badge>{deployment.environment.toLowerCase()}</Badge>
          </p>
          <p>
            Modo: <Badge>{deployment.mode.toLowerCase()}</Badge>
          </p>
          <p>
            CMS: <Badge>{deployment.cmsEnabled ? "ativo" : "inativo"}</Badge>
          </p>
          <p>
            Deploy: <Badge>{deployment.deploymentStatus}</Badge>
          </p>
          <p>
            Domínio: <Badge>{deployment.domainStatus}</Badge>
          </p>
          <p>
            SSL: <Badge>{deployment.sslStatus}</Badge>
          </p>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Erros Frequentes</CardTitle>
          <CardDescription>
            Agrupamento por fingerprint para identificar padrões recorrentes.
          </CardDescription>
        </CardHeader>
        <DataTable
          caption="Erros frequentes"
          columns={["Ocorrências", "Nível", "Origem", "Mensagem"]}
          rows={frequentErrors.map((error) => [
            String(error._count._all),
            error.level.toLowerCase(),
            error.source.toLowerCase(),
            <span className="block max-w-md truncate" key={error.fingerprint}>
              {error.message}
            </span>,
          ])}
        />
      </Card>
    </div>
  );
}
