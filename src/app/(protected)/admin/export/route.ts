import { NextRequest } from "next/server";

import {
  exportFormsJson,
  exportPagesCsv,
  exportPagesJson,
  exportSettingsJson,
} from "@/features/exports/services/export.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "pages";
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  if (type === "settings") {
    await requirePermission(permissions.settingsRead);
  } else {
    await requirePermission(permissions.auditExport);
  }

  if (type === "forms") {
    return jsonDownload(await exportFormsJson(), "landingforge-forms.json");
  }
  if (type === "settings") {
    return jsonDownload(await exportSettingsJson(), "landingforge-settings.json");
  }
  if (type === "pages" && format === "csv") {
    return csvDownload(await exportPagesCsv(), "landingforge-pages.csv");
  }

  return jsonDownload(await exportPagesJson(), "landingforge-pages.json");
}

function jsonDownload(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function csvDownload(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
