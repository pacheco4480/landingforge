import { NextRequest } from "next/server";

import { leadFiltersSchema } from "@/features/leads/schemas/lead.schema";
import { exportLeadsCsv } from "@/features/leads/services/lead-export.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: NextRequest) {
  await requirePermission(permissions.leadsExport);
  const filters = leadFiltersSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  const csv = await exportLeadsCsv(filters);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="landingforge-leads.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
