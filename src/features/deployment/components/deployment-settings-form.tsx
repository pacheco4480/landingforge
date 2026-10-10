import { Button } from "@/components/ui/button";
import { Field, FieldMessage, Input, Label, Select, Switch } from "@/components/ui/form";
import { Card, CardDescription, CardHeader, CardTitle, Grid } from "@/components/ui/layout";
import {
  deploymentEnvironments,
  deploymentModes,
  deploymentStatuses,
  domainStatuses,
  sslStatuses,
} from "@/config/deployment";
import { updateDeploymentSettingsAction } from "@/features/deployment/actions/deployment.actions";
import type { getDeploymentWorkspace } from "@/features/deployment/services/deployment.service";

type DeploymentWorkspace = Awaited<ReturnType<typeof getDeploymentWorkspace>>;

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function DeploymentSettingsForm({
  canWrite,
  workspace,
}: {
  canWrite: boolean;
  workspace: DeploymentWorkspace;
}) {
  const settings = workspace.clientSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Deploy</CardTitle>
        <CardDescription>
          Define o modo de entrega, domínio e readiness deste projeto.
        </CardDescription>
      </CardHeader>
      <form action={updateDeploymentSettingsAction} className="grid gap-5">
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="deploymentMode">Modo</Label>
            <Select
              id="deploymentMode"
              name="deploymentMode"
              defaultValue={settings.deploymentMode}
              disabled={!canWrite}
            >
              {deploymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {label(mode)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="deploymentEnvironment">Ambiente</Label>
            <Select
              id="deploymentEnvironment"
              name="deploymentEnvironment"
              defaultValue={settings.deploymentEnvironment}
              disabled={!canWrite}
            >
              {deploymentEnvironments.map((environment) => (
                <option key={environment} value={environment}>
                  {label(environment)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="deploymentStatus">Estado do deploy</Label>
            <Select
              id="deploymentStatus"
              name="deploymentStatus"
              defaultValue={settings.deploymentStatus}
              disabled={!canWrite}
            >
              {deploymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="domain">Domínio do cliente</Label>
            <Input
              id="domain"
              name="domain"
              defaultValue={workspace.site?.domain ?? ""}
              placeholder="cliente.pt"
              disabled={!canWrite}
            />
            <FieldMessage>
              Guarda apenas o domínio, sem protocolo nem caminho.
            </FieldMessage>
          </Field>
          <Field>
            <Label htmlFor="domainStatus">Estado DNS</Label>
            <Select
              id="domainStatus"
              name="domainStatus"
              defaultValue={settings.domainStatus}
              disabled={!canWrite}
            >
              {domainStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="sslStatus">Estado SSL</Label>
            <Select
              id="sslStatus"
              name="sslStatus"
              defaultValue={settings.sslStatus}
              disabled={!canWrite}
            >
              {sslStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </Select>
          </Field>
        </Grid>
        <label className="flex items-start gap-3">
          <Switch
            name="readyForDelivery"
            defaultChecked={settings.readyForDelivery}
            disabled={!canWrite}
          />
          <span className="grid gap-1">
            <span className="text-sm font-semibold">Pronto para entrega</span>
            <span className="text-muted-foreground text-sm">
              Marca este projeto como validado para entrega ao cliente.
            </span>
          </span>
        </label>
        {canWrite ? (
          <Button type="submit" className="w-fit">
            Guardar deployment
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
