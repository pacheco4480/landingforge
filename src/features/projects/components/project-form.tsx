import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import {
  MaintenancePlan,
  ProjectDeliveryMode,
  ProjectParty,
  ProjectPriority,
  ProjectServiceType,
  ProjectStatus,
} from "@/generated/prisma/client";
import {
  createProjectAction,
  updateProjectAction,
} from "@/features/projects/actions/project.actions";

type ProjectOptions = {
  clients: Array<{ id: string; businessName: string }>;
  industries: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string; variants: Array<{ id: string; name: string }> }>;
  users: Array<{ id: string; name: string; email: string }>;
};

type ProjectFormValue = {
  id?: string;
  clientId?: string;
  name?: string;
  serviceType?: ProjectServiceType;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  industryId?: string | null;
  templateId?: string | null;
  templateVariantId?: string | null;
  deliveryMode?: ProjectDeliveryMode;
  siteManagementOwner?: ProjectParty;
  hostingOwner?: ProjectParty;
  domainOwner?: ProjectParty;
  contentOwner?: ProjectParty;
  publishingOwner?: ProjectParty;
  maintenancePlan?: MaintenancePlan;
  maintenanceScope?: string | null;
  maintenanceChannel?: string | null;
  maintenanceWindow?: string | null;
  startDate?: Date | null;
  deliveryDate?: Date | null;
  serviceEndedAt?: Date | null;
  assignments?: Array<{ userId: string }>;
};

const serviceLabels: Record<ProjectServiceType, string> = {
  [ProjectServiceType.TEMPLATE_ADAPTATION]: "Adaptação de template",
  [ProjectServiceType.STRUCTURAL_CHANGE]: "Alteração estrutural",
  [ProjectServiceType.NEW_TEMPLATE]: "Novo template",
  [ProjectServiceType.MAINTENANCE]: "Manutenção de projeto",
};
const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEFING]: "Briefing",
  [ProjectStatus.CONTENT_COLLECTION]: "Recolha de conteúdos",
  [ProjectStatus.PLANNING]: "Planeamento",
  [ProjectStatus.DEVELOPMENT]: "Desenvolvimento",
  [ProjectStatus.REVIEW]: "Revisão",
  [ProjectStatus.APPROVED]: "Aprovado",
  [ProjectStatus.DELIVERED]: "Entregue",
  [ProjectStatus.MAINTENANCE]: "Manutenção",
  [ProjectStatus.ARCHIVED]: "Arquivado",
};
const priorityLabels: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: "Baixa",
  [ProjectPriority.NORMAL]: "Normal",
  [ProjectPriority.HIGH]: "Alta",
};
const partyLabels: Record<ProjectParty, string> = {
  [ProjectParty.LANDINGFORGE]: "LandingForge",
  [ProjectParty.CLIENT]: "Cliente",
  [ProjectParty.SHARED]: "Partilhada",
  [ProjectParty.NOT_APPLICABLE]: "Não aplicável",
};
const maintenanceLabels: Record<MaintenancePlan, string> = {
  [MaintenancePlan.NONE]: "Sem manutenção",
  [MaintenancePlan.ON_DEMAND]: "Pedidos avulsos",
  [MaintenancePlan.CONTRACTED]: "Plano contratado",
};

function toDateInput(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ProjectForm({
  project,
  options,
  canAssign,
  currentUserId,
}: {
  project?: ProjectFormValue;
  options: ProjectOptions;
  canAssign: boolean;
  currentUserId: string;
}) {
  const action = project?.id ? updateProjectAction : createProjectAction;
  const assignedIds = project?.assignments?.map((assignment) => assignment.userId) ?? [currentUserId];

  return (
    <Card>
      <ActionFeedbackForm
        action={action}
        className="grid gap-6"
        loadingMessage={project?.id ? "A guardar projeto…" : "A criar projeto…"}
        successMessage="Projeto guardado."
      >
        {project?.id ? <input name="id" type="hidden" value={project.id} /> : null}
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="name">Nome do projeto</Label>
              <Input id="name" name="name" required maxLength={160} defaultValue={project?.name ?? ""} />
            </Field>
            <Field>
              <Label htmlFor="clientId">Cliente</Label>
              <Select id="clientId" name="clientId" required defaultValue={project?.clientId ?? options.clients[0]?.id ?? ""}>
                <option value="" disabled>Seleciona um cliente</option>
                {options.clients.map((client) => <option key={client.id} value={client.id}>{client.businessName}</option>)}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-3">
            <Field>
              <Label htmlFor="serviceType">Tipo de serviço</Label>
              <Select id="serviceType" name="serviceType" defaultValue={project?.serviceType ?? ProjectServiceType.TEMPLATE_ADAPTATION}>
                {Object.values(ProjectServiceType).map((value) => <option key={value} value={value}>{serviceLabels[value]}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="status">Estado do projeto</Label>
              <Select id="status" name="status" defaultValue={project?.status ?? ProjectStatus.BRIEFING}>
                {Object.values(ProjectStatus).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="priority">Prioridade</Label>
              <Select id="priority" name="priority" defaultValue={project?.priority ?? ProjectPriority.NORMAL}>
                {Object.values(ProjectPriority).map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-3">
            <Field>
              <Label htmlFor="industryId">Indústria</Label>
              <Select id="industryId" name="industryId" defaultValue={project?.industryId ?? ""}>
                <option value="">Sem seleção</option>
                {options.industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="templateId">Template de origem</Label>
              <Select id="templateId" name="templateId" defaultValue={project?.templateId ?? ""}>
                <option value="">A definir</option>
                {options.templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="templateVariantId">Variante</Label>
              <Select id="templateVariantId" name="templateVariantId" defaultValue={project?.templateVariantId ?? ""}>
                <option value="">A definir</option>
                {options.templates.flatMap((template) => template.variants.map((variant) => <option key={variant.id} value={variant.id}>{template.name} · {variant.name}</option>))}
              </Select>
            </Field>
          </Grid>
          <Alert tone="warning" title="Versão de template">
            A versão fica fixada quando criares a cópia privada. Depois disso, não poderás trocar o template de origem neste projeto; as alterações editoriais devem ser feitas na cópia, nunca na demo oficial.
          </Alert>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="deliveryMode">Entrega ao cliente</Label>
              <Select id="deliveryMode" name="deliveryMode" defaultValue={project?.deliveryMode ?? ProjectDeliveryMode.LANDING_ONLY}>
                <option value={ProjectDeliveryMode.LANDING_ONLY}>Landing sem CMS de cliente</option>
                <option value={ProjectDeliveryMode.LANDING_WITH_CMS}>Landing + CMS de cliente</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="maintenancePlan">Manutenção</Label>
              <Select id="maintenancePlan" name="maintenancePlan" defaultValue={project?.maintenancePlan ?? MaintenancePlan.NONE}>
                {Object.values(MaintenancePlan).map((value) => <option key={value} value={value}>{maintenanceLabels[value]}</option>)}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="siteManagementOwner">Gestão do site</Label>
              <Select id="siteManagementOwner" name="siteManagementOwner" defaultValue={project?.siteManagementOwner ?? ProjectParty.LANDINGFORGE}>
                {Object.values(ProjectParty).map((value) => <option key={value} value={value}>{partyLabels[value]}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="publishingOwner">Publicação</Label>
              <Select id="publishingOwner" name="publishingOwner" defaultValue={project?.publishingOwner ?? ProjectParty.LANDINGFORGE}>
                {Object.values(ProjectParty).map((value) => <option key={value} value={value}>{partyLabels[value]}</option>)}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-3">
            {([
              ["hostingOwner", "Alojamento", project?.hostingOwner ?? ProjectParty.CLIENT],
              ["domainOwner", "Domínio", project?.domainOwner ?? ProjectParty.CLIENT],
              ["contentOwner", "Conteúdo", project?.contentOwner ?? ProjectParty.CLIENT],
            ] as const).map(([name, label, defaultValue]) => (
              <Field key={name}>
                <Label htmlFor={name}>{label}</Label>
                <Select id={name} name={name} defaultValue={defaultValue}>
                  {Object.values(ProjectParty).map((value) => <option key={value} value={value}>{partyLabels[value]}</option>)}
                </Select>
              </Field>
            ))}
          </Grid>
          <Grid className="md:grid-cols-3">
            <Field>
              <Label htmlFor="startDate">Data de início</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInput(project?.startDate)} />
            </Field>
            <Field>
              <Label htmlFor="deliveryDate">Data prevista de entrega</Label>
              <Input id="deliveryDate" name="deliveryDate" type="date" defaultValue={toDateInput(project?.deliveryDate)} />
            </Field>
            <Field>
              <Label htmlFor="serviceEndedAt">Fim efetivo do serviço</Label>
              <Input id="serviceEndedAt" name="serviceEndedAt" type="date" defaultValue={toDateInput(project?.serviceEndedAt)} />
              <p className="text-muted-foreground text-xs">Preenche apenas depois de terminar a manutenção. Serve para revisão de retenção, não para apagar dados automaticamente.</p>
            </Field>
            <Field>
              <Label htmlFor="maintenanceChannel">Canal de manutenção</Label>
              <Input id="maintenanceChannel" name="maintenanceChannel" maxLength={200} defaultValue={project?.maintenanceChannel ?? ""} />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="maintenanceScope">Âmbito da manutenção</Label>
              <Textarea id="maintenanceScope" name="maintenanceScope" maxLength={3000} defaultValue={project?.maintenanceScope ?? ""} />
            </Field>
            <Field>
              <Label htmlFor="maintenanceWindow">Prazo / janela acordada</Label>
              <Textarea id="maintenanceWindow" name="maintenanceWindow" maxLength={200} defaultValue={project?.maintenanceWindow ?? ""} />
            </Field>
          </Grid>
          {canAssign ? (
            <Field>
              <Label htmlFor="assigneeIds">Responsáveis internos</Label>
              <select id="assigneeIds" name="assigneeIds" multiple defaultValue={assignedIds} className="border-input bg-background text-foreground focus:border-ring focus-visible:outline-ring min-h-32 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {options.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
              </select>
              <p className="text-muted-foreground text-sm">Só utilizadores internos ativos podem ser atribuídos. Utilizadores Client Admin não aparecem nesta lista.</p>
            </Field>
          ) : null}
          <div>
            <Button type="submit">{project?.id ? "Guardar projeto" : "Criar projeto"}</Button>
          </div>
        </Stack>
      </ActionFeedbackForm>
    </Card>
  );
}
