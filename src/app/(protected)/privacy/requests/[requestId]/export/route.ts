import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrivacyAccessExport } from "@/features/privacy/services/privacy.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const user = await requirePermission(permissions.adminAccess);
  const { requestId } = await params;
  if (!z.uuid().safeParse(requestId).success) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  const data = await getPrivacyAccessExport(requestId);
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "privacy.request.access_preview_export",
      entityType: "privacy_request",
      entityId: requestId,
      newValues: { exportType: "structured-access-review", includesFreeText: false },
    },
  });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="privacy-access-review-${requestId}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
