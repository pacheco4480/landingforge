import { Prisma } from "@/generated/prisma/client";
import type { ClientKnowledgeEntryInput } from "@/features/clients/schemas/client-knowledge.schema";
import { clientWhereForActor } from "@/features/clients/client-access";
import { projectWhereForActor } from "@/features/projects/project-access";
import { db } from "@/lib/db";

type ClientKnowledgeActor = { id: string; roles: readonly string[] };

export async function listClientKnowledgeEntries(
  clientId: string,
  actor: ClientKnowledgeActor,
) {
  return db.clientKnowledgeEntry.findMany({
    where: {
      clientId,
      client: { deletedAt: null, ...clientWhereForActor(actor) },
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      projectId: true,
      category: true,
      title: true,
      content: true,
      updatedAt: true,
      project: { select: { name: true } },
    },
  });
}

async function assertClientAndProject(
  tx: Prisma.TransactionClient,
  input: ClientKnowledgeEntryInput,
  actor: ClientKnowledgeActor,
) {
  await tx.client.findFirstOrThrow({
    where: {
      id: input.clientId,
      deletedAt: null,
      ...clientWhereForActor(actor),
    },
    select: { id: true },
  });
  if (input.projectId) {
    await tx.project.findFirstOrThrow({
      where: {
        id: input.projectId,
        clientId: input.clientId,
        deletedAt: null,
        ...projectWhereForActor(actor),
      },
      select: { id: true },
    });
  }
}

export async function createClientKnowledgeEntry(
  input: ClientKnowledgeEntryInput,
  actor: ClientKnowledgeActor,
) {
  return db.$transaction(async (tx) => {
    await assertClientAndProject(tx, input, actor);
    const entry = await tx.clientKnowledgeEntry.create({
      data: {
        clientId: input.clientId,
        projectId: input.projectId || null,
        category: input.category,
        title: input.title,
        content: input.content,
        createdByUserId: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "client.knowledge.create",
        entityType: "client_knowledge_entry",
        entityId: entry.id,
        newValues: { clientId: input.clientId, category: entry.category },
      },
    });
    return entry;
  });
}

export async function updateClientKnowledgeEntry(
  id: string,
  input: ClientKnowledgeEntryInput,
  actor: ClientKnowledgeActor,
) {
  return db.$transaction(async (tx) => {
    await assertClientAndProject(tx, input, actor);
    const existing = await tx.clientKnowledgeEntry.findFirstOrThrow({
      where: {
        id,
        clientId: input.clientId,
        client: { deletedAt: null, ...clientWhereForActor(actor) },
      },
      select: { id: true, category: true },
    });
    const entry = await tx.clientKnowledgeEntry.update({
      where: { id: existing.id },
      data: {
        projectId: input.projectId || null,
        category: input.category,
        title: input.title,
        content: input.content,
        updatedByUserId: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "client.knowledge.update",
        entityType: "client_knowledge_entry",
        entityId: entry.id,
        oldValues: { category: existing.category },
        newValues: { clientId: input.clientId, category: entry.category },
      },
    });
    return entry;
  });
}

export async function deleteClientKnowledgeEntry(
  id: string,
  clientId: string,
  actor: ClientKnowledgeActor,
) {
  return db.$transaction(async (tx) => {
    const existing = await tx.clientKnowledgeEntry.findFirstOrThrow({
      where: {
        id,
        clientId,
        client: { deletedAt: null, ...clientWhereForActor(actor) },
      },
      select: { id: true, category: true },
    });
    await tx.clientKnowledgeEntry.delete({ where: { id: existing.id } });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "client.knowledge.delete",
        entityType: "client_knowledge_entry",
        entityId: id,
        oldValues: { clientId, category: existing.category },
      },
    });
  });
}
