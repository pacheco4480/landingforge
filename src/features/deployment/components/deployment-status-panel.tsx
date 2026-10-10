import { Badge, Status } from "@/components/ui/feedback";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import type { getDeploymentWorkspace } from "@/features/deployment/services/deployment.service";

type DeploymentWorkspace = Awaited<ReturnType<typeof getDeploymentWorkspace>>;

function statusTone(value: string) {
  if (["READY", "LIVE", "CONNECTED", "ACTIVE"].includes(value)) {
    return "success" as const;
  }
  if (["BLOCKED", "ERROR"].includes(value)) return "error" as const;
  if (["CONFIGURING", "PENDING"].includes(value)) return "warning" as const;
  return "neutral" as const;
}

function label(value: string | boolean) {
  if (typeof value === "boolean") return value ? "Ativo" : "Inativo";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function DeploymentStatusPanel({
  workspace,
}: {
  workspace: DeploymentWorkspace;
}) {
  const settings = workspace.clientSettings;

  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-muted-foreground text-sm font-medium">Modo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="info">{label(workspace.runtimeMode)}</Badge>
          <Badge tone={workspace.cmsEnabled ? "success" : "neutral"}>
            {workspace.cmsEnabled ? "Landing + CMS" : "Landing Only"}
          </Badge>
        </div>
      </Card>
      <Card>
        <p className="text-muted-foreground text-sm font-medium">Ambiente</p>
        <p className="mt-3 text-lg font-semibold">
          {label(workspace.runtimeEnvironment)}
        </p>
      </Card>
      <Card>
        <p className="text-muted-foreground text-sm font-medium">Deploy</p>
        <div className="mt-3">
          <Status tone={statusTone(settings.deploymentStatus)}>
            {label(settings.deploymentStatus)}
          </Status>
        </div>
      </Card>
      <Card>
        <p className="text-muted-foreground text-sm font-medium">Entrega</p>
        <p className="mt-3 text-lg font-semibold">
          {workspace.completedItems}/{workspace.totalItems}
        </p>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Domínio</CardTitle>
          <CardDescription>
            Estado declarado para ligação do domínio e SSL.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Domínio</span>
            <span className="font-semibold">
              {workspace.site?.domain ?? "Não configurado"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">DNS</span>
            <Status tone={statusTone(settings.domainStatus)}>
              {label(settings.domainStatus)}
            </Status>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">SSL</span>
            <Status tone={statusTone(settings.sslStatus)}>
              {label(settings.sslStatus)}
            </Status>
          </div>
        </div>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
          <CardDescription>
            A entrega deve ser marcada como pronta apenas depois da checklist.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <Status tone={settings.readyForDelivery ? "success" : "warning"}>
            {settings.readyForDelivery
              ? "Pronto para entrega"
              : "Ainda não aprovado para entrega"}
          </Status>
          <p className="text-muted-foreground">
            URL pública: {workspace.publicSiteUrl}
          </p>
        </div>
      </Card>
    </Grid>
  );
}
