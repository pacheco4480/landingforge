import { Prisma } from "@/generated/prisma/client";
import { auditFiltersSchema, type AuditFilters } from "@/features/audit/schemas/audit.schema";
import { db } from "@/lib/db";

export const auditPageSize = 80;

export function buildAuditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  return {
    ...(filters.action ? { action: { contains: filters.action } } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { action: { contains: filters.search } },
            { entityType: { contains: filters.search } },
            { user: { is: { email: { contains: filters.search } } } },
            { user: { is: { name: { contains: filters.search } } } },
          ],
        }
      : {}),
  };
}

export async function getAuditWorkspace(filtersInput: unknown) {
  const filters = auditFiltersSchema.parse(filtersInput);
  const where = buildAuditWhere(filters);

  const [logs, total, users, actions, entityTypes, summary] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: auditPageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.auditLog.count({ where }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
      take: 100,
    }),
    db.auditLog.findMany({
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
      select: { entityType: true },
      take: 100,
    }),
    getAuditSummary(),
  ]);

  return {
    actions: actions.map((item) => item.action),
    entityTypes: entityTypes.map((item) => item.entityType),
    filters,
    logs,
    summary,
    total,
    users,
  };
}

export async function getAuditSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, last24h, latest] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.count({ where: { createdAt: { gte: since } } }),
    db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { action: true, createdAt: true },
    }),
  ]);

  return { total, last24h, latest };
}

export async function getRecentAuditActivity(take = 5) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true, email: true } } },
  });
}
