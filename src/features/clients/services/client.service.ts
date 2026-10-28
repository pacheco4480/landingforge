import { ClientStatus, Prisma } from "@/generated/prisma/client";
import type { ClientInput } from "@/features/clients/schemas/client.schema";
import { clientWhereForActor } from "@/features/clients/client-access";
import { projectWhereForActor } from "@/features/projects/project-access";
import { db } from "@/lib/db";

type ClientActor = { id: string; roles: readonly string[] };

function normalizeOptional(value?: string | null) {
  return value?.trim() || null;
}

function dateValue(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export type ClientWorkspaceFilters = {
  query?: string;
  industry?: string;
  status?: ClientStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
};

const CLIENTS_PAGE_SIZE = 50;

export async function getClientsWorkspace(
  actor: ClientActor,
  filters: ClientWorkspaceFilters = {},
) {
  const where: Prisma.ClientWhereInput = {
    deletedAt: null,
    ...clientWhereForActor(actor),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.industry
      ? { industry: { contains: filters.industry, mode: "insensitive" } }
      : {}),
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
            { businessName: { contains: filters.query, mode: "insensitive" } },
            { name: { contains: filters.query, mode: "insensitive" } },
            { email: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const total = await db.client.count({ where });
  const totalPages = Math.ceil(total / CLIENTS_PAGE_SIZE);
  const page = Math.min(
    Math.max(filters.page ?? 1, 1),
    Math.max(totalPages, 1),
  );
  const clients = await db.client.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }, { id: "asc" }],
    skip: (page - 1) * CLIENTS_PAGE_SIZE,
    take: CLIENTS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      businessName: true,
      industry: true,
      email: true,
      phone: true,
      status: true,
      updatedAt: true,
      lastMeaningfulContactAt: true,
      _count: {
        select: {
          projects: {
            where: { deletedAt: null, ...projectWhereForActor(actor) },
          },
        },
      },
    },
  });

  return {
    clients,
    pagination: { page, pageSize: CLIENTS_PAGE_SIZE, total, totalPages },
  };
}

export async function getClientForActor(
  id: string,
  actor: ClientActor,
  includeNotes: boolean,
) {
  const client = await db.client.findFirst({
    where: { id, deletedAt: null, ...clientWhereForActor(actor) },
    select: {
      id: true,
      name: true,
      businessName: true,
      industry: true,
      website: true,
      email: true,
      phone: true,
      address: true,
      vatNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastMeaningfulContactAt: true,
      ...(includeNotes ? { internalNotes: true } : {}),
      projects: {
        where: { deletedAt: null, ...projectWhereForActor(actor) },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          deliveryMode: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!client) throw new Error("Cliente não encontrado ou sem acesso.");
  return client;
}

export async function createClient(input: ClientInput, userId: string) {
  const data = {
    ...input,
    industry: normalizeOptional(input.industry),
    website: normalizeOptional(input.website),
    email: normalizeOptional(input.email)?.toLowerCase() ?? null,
    phone: normalizeOptional(input.phone),
    address: normalizeOptional(input.address),
    vatNumber: normalizeOptional(input.vatNumber),
    internalNotes: normalizeOptional(input.internalNotes),
    lastMeaningfulContactAt: dateValue(input.lastMeaningfulContactAt),
  };

  return db.$transaction(async (tx) => {
    const client = await tx.client.create({ data });
    await tx.auditLog.create({
      data: {
        userId,
        action: "client.create",
        entityType: "client",
        entityId: client.id,
        newValues: { status: client.status },
      },
    });
    return client;
  });
}

export async function updateClient(
  id: string,
  input: ClientInput,
  userId: string,
  actor: ClientActor,
  canWriteNotes: boolean,
) {
  return db.$transaction(async (tx) => {
    const existing = await tx.client.findFirstOrThrow({
      where: { id, deletedAt: null, ...clientWhereForActor(actor) },
      select: { id: true, status: true },
    });
    const data: Prisma.ClientUpdateInput = {
      name: input.name,
      businessName: input.businessName,
      industry: normalizeOptional(input.industry),
      website: normalizeOptional(input.website),
      email: normalizeOptional(input.email)?.toLowerCase() ?? null,
      phone: normalizeOptional(input.phone),
      address: normalizeOptional(input.address),
      vatNumber: normalizeOptional(input.vatNumber),
      status: input.status ?? ClientStatus.LEAD,
      lastMeaningfulContactAt: dateValue(input.lastMeaningfulContactAt),
      ...(canWriteNotes
        ? { internalNotes: normalizeOptional(input.internalNotes) }
        : {}),
    };
    const client = await tx.client.update({ where: { id: existing.id }, data });
    await tx.auditLog.create({
      data: {
        userId,
        action: "client.update",
        entityType: "client",
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: client.status },
      },
    });
    return client;
  });
}
