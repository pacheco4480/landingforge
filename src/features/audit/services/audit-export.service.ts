import type { AuditLog, User } from "@/generated/prisma/client";
import { auditFiltersSchema } from "@/features/audit/schemas/audit.schema";
import { buildAuditWhere } from "@/features/audit/services/audit.service";
import { toCsv } from "@/features/exports/services/csv.service";
import { db } from "@/lib/db";

type AuditLogWithUser = AuditLog & {
  user: Pick<User, "name" | "email"> | null;
};

export async function exportAuditLogsCsv(filtersInput: unknown) {
  const filters = auditFiltersSchema.parse(filtersInput);
  const logs = await db.auditLog.findMany({
    where: buildAuditWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: { select: { name: true, email: true } } },
  });

  return toCsv([
    [
      "Data",
      "Utilizador",
      "Email",
      "Acao",
      "Entidade",
      "ID Entidade",
      "IP",
      "User Agent",
      "Old Values",
      "New Values",
    ],
    ...logs.map((log) => auditLogRow(log)),
  ]);
}

export async function exportAuditLogsJson(filtersInput: unknown) {
  const filters = auditFiltersSchema.parse(filtersInput);
  const logs = await db.auditLog.findMany({
    where: buildAuditWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: { select: { name: true, email: true } } },
  });

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: logs.length,
      logs,
    },
    null,
    2,
  );
}

function auditLogRow(log: AuditLogWithUser) {
  return [
    log.createdAt,
    log.user?.name ?? "",
    log.user?.email ?? "",
    log.action,
    log.entityType,
    log.entityId ?? "",
    log.ipAddress ?? "",
    log.userAgent ?? "",
    stringifyJson(log.oldValues),
    stringifyJson(log.newValues),
  ];
}

function stringifyJson(value: unknown) {
  if (value == null) return "";
  return JSON.stringify(value);
}
