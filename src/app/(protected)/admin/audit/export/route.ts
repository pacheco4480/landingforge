import { NextRequest } from "next/server";

import {
  exportAuditLogsCsv,
  exportAuditLogsJson,
} from "@/features/audit/services/audit-export.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: NextRequest) {
  await requirePermission(permissions.auditExport);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (format === "json") {
    const json = await exportAuditLogsJson(params);
    return new Response(json, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="landingforge-audit-logs.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  const csv = await exportAuditLogsCsv(params);
  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="landingforge-audit-logs.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
