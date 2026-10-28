import {
  ProjectStatus,
  Prisma,
} from "@/generated/prisma/client";
import type { ProjectInput } from "@/features/projects/schemas/project.schema";
import { projectWhereForActor } from "@/features/projects/project-access";
import { db } from "@/lib/db";

type ProjectActor = { id: string; roles: readonly string[] };

function nullable(value?: string | null) {
  return value?.trim() || null;
}

function dateValue(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export type ProjectWorkspaceFilters = {
  query?: string;
  industryId?: string;
  status?: ProjectStatus;
  dateFrom?: Date;
  dateTo?: Date;
};

export async function getProjectsWorkspace(
  actor: ProjectActor,
  filters: ProjectWorkspaceFilters = {},
) {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...projectWhereForActor(actor),
    ...(filters.industryId ? { industryId: filters.industryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          updatedAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
    ...(filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            {
              client: {
                businessName: { contains: filters.query, mode: "insensitive" },
              },
            },
            {
              template: {
                name: { contains: filters.query, mode: "insensitive" },
              },
            },
            {
              templateVariant: {
                name: { contains: filters.query, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };
  const scopeWhere: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...projectWhereForActor(actor),
  };
  const [projects, counts] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        deliveryMode: true,
        updatedAt: true,
        client: { select: { id: true, businessName: true } },
        template: { select: { name: true } },
        templateVariant: { select: { name: true } },
      },
    }),
    db.project.groupBy({ by: ["status"], where: scopeWhere, _count: { _all: true } }),
  ]);

  return {
    projects,
    metrics: Object.values(ProjectStatus).map((status) => ({
      status,
      count: counts.find((item) => item.status === status)?._count._all ?? 0,
    })),
  };
}

export async function getProjectOptions(actor: ProjectActor) {
  const [clients, industries, templates, users] = await Promise.all([
    db.client.findMany({
      where: { deletedAt: null, ...clientScope(actor) },
      orderBy: { businessName: "asc" },
      select: { id: true, businessName: true },
    }),
    db.industry.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.template.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        variants: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
    db.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        roles: { none: { role: { name: "client_admin" } } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  return { clients, industries, templates, users };
}

export async function getProjectFilterOptions() {
  const industries = await db.industry.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return industries;
}

function clientScope(actor: ProjectActor): Prisma.ClientWhereInput {
  if (actor.roles.includes("super_admin")) return {};
  return { projects: { some: projectWhereForActor(actor) } };
}

export async function getProjectForActor(id: string, actor: ProjectActor) {
  const project = await db.project.findFirst({
    where: { id, deletedAt: null, ...projectWhereForActor(actor) },
    include: {
      client: { select: { id: true, businessName: true } },
      industry: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      templateVariant: { select: { id: true, name: true } },
      assignments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      sourceVersions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          version: true,
          templateVersion: true,
          checksum: true,
          createdAt: true,
          provisionedPage: { select: { id: true, title: true, slug: true, status: true } },
        },
      },
    },
  });
  if (!project) throw new Error("Projeto não encontrado ou sem acesso.");
  return project;
}

function projectData(input: ProjectInput): Prisma.ProjectUncheckedCreateInput {
  return {
    clientId: input.clientId,
    name: input.name,
    serviceType: input.serviceType,
    status: input.status,
    priority: input.priority,
    industryId: nullable(input.industryId),
    templateId: nullable(input.templateId),
    templateVariantId: nullable(input.templateVariantId),
    deliveryMode: input.deliveryMode,
    siteManagementOwner: input.siteManagementOwner,
    hostingOwner: input.hostingOwner,
    domainOwner: input.domainOwner,
    contentOwner: input.contentOwner,
    publishingOwner: input.publishingOwner,
    maintenancePlan: input.maintenancePlan,
    maintenanceScope: nullable(input.maintenanceScope),
    maintenanceChannel: nullable(input.maintenanceChannel),
    maintenanceWindow: nullable(input.maintenanceWindow),
    startDate: dateValue(input.startDate),
    deliveryDate: dateValue(input.deliveryDate),
    serviceEndedAt: dateValue(input.serviceEndedAt),
  };
}

async function assertTemplateSelection(
  tx: Prisma.TransactionClient,
  templateId?: string,
  variantId?: string,
) {
  if (templateId) {
    const template = await tx.template.findFirst({
      where: { id: templateId, isActive: true },
      select: { id: true },
    });
    if (!template) throw new Error("O template selecionado já não está ativo.");
  }
  if (variantId) {
    const variant = await tx.templateVariant.findFirst({
      where: { id: variantId, isActive: true, templateId },
      select: { id: true },
    });
    if (!variant) throw new Error("A variante não pertence ao template selecionado.");
  }
}

export async function createProject(
  input: ProjectInput,
  actor: ProjectActor,
  canAssign: boolean,
) {
  return db.$transaction(async (tx) => {
    await tx.client.findFirstOrThrow({
      where: { id: input.clientId, deletedAt: null, ...clientScope(actor) },
      select: { id: true },
    });
    await assertTemplateSelection(tx, nullable(input.templateId) ?? undefined, nullable(input.templateVariantId) ?? undefined);
    const project = await tx.project.create({ data: projectData(input) });
    const assigneeIds = canAssign
      ? [...new Set([...input.assigneeIds, actor.id])]
      : [actor.id];
    const activeInternalUsers = await tx.user.findMany({
      where: {
        id: { in: assigneeIds },
        status: "ACTIVE",
        deletedAt: null,
        roles: { none: { role: { name: "client_admin" } } },
      },
      select: { id: true },
    });
    if (activeInternalUsers.length !== assigneeIds.length) {
      throw new Error("Um ou mais responsáveis não são utilizadores internos ativos.");
    }
    await tx.projectAssignment.createMany({
      data: assigneeIds.map((userId) => ({
        projectId: project.id,
        userId,
        assignedByUserId: actor.id,
      })),
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "project.create",
        entityType: "project",
        entityId: project.id,
        newValues: {
          clientId: project.clientId,
          status: project.status,
          deliveryMode: project.deliveryMode,
          assignedUserIds: assigneeIds,
        },
      },
    });
    return project;
  });
}

export async function updateProject(
  id: string,
  input: ProjectInput,
  actor: ProjectActor,
  canAssign: boolean,
) {
  return db.$transaction(async (tx) => {
    const existing = await tx.project.findFirstOrThrow({
      where: { id, deletedAt: null, ...projectWhereForActor(actor) },
      select: {
        id: true,
        status: true,
        deliveryMode: true,
        clientId: true,
        templateId: true,
        templateVariantId: true,
        assignments: { select: { userId: true } },
        sourceVersions: { where: { version: 1 }, take: 1, select: { id: true } },
      },
    });
    if (
      existing.sourceVersions.length > 0 &&
      (existing.templateId !== nullable(input.templateId) ||
        existing.templateVariantId !== nullable(input.templateVariantId))
    ) {
      throw new Error("O template não pode ser alterado depois de criar a cópia privada do projeto.");
    }
    await tx.client.findFirstOrThrow({
      where: { id: input.clientId, deletedAt: null, ...clientScope(actor) },
      select: { id: true },
    });
    await assertTemplateSelection(tx, nullable(input.templateId) ?? undefined, nullable(input.templateVariantId) ?? undefined);
    const project = await tx.project.update({
      where: { id: existing.id },
      data: projectData(input),
    });
    if (canAssign) {
      const assigneeIds = [...new Set([...input.assigneeIds, actor.id])];
      const activeInternalUsers = await tx.user.findMany({
        where: {
          id: { in: assigneeIds },
          status: "ACTIVE",
          deletedAt: null,
          roles: { none: { role: { name: "client_admin" } } },
        },
        select: { id: true },
      });
      if (activeInternalUsers.length !== assigneeIds.length) {
        throw new Error("Um ou mais responsáveis não são utilizadores internos ativos.");
      }
      await tx.projectAssignment.deleteMany({ where: { projectId: id } });
      if (assigneeIds.length) {
        await tx.projectAssignment.createMany({
          data: assigneeIds.map((userId) => ({
            projectId: id,
            userId,
            assignedByUserId: actor.id,
          })),
        });
      }
    }
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "project.update",
        entityType: "project",
        entityId: id,
        oldValues: {
          status: existing.status,
          deliveryMode: existing.deliveryMode,
          assignedUserIds: existing.assignments.map((assignment) => assignment.userId),
        },
        newValues: {
          status: project.status,
          deliveryMode: project.deliveryMode,
          assignedUserIds: canAssign
            ? [...new Set([...input.assigneeIds, actor.id])]
            : existing.assignments.map((assignment) => assignment.userId),
        },
      },
    });
    return project;
  });
}
