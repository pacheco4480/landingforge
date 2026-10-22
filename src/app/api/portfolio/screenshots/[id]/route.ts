import { NextResponse } from "next/server";

import { createInternalScreenshotUrl } from "@/features/portfolio/services/portfolio-screenshot.service";
import { permissions } from "@/features/rbac/permissions";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!hasPermission(user.permissions, permissions.adminAccess)) {
    return new Response("Acesso negado.", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const { id } = await params;
  const signedUrl = await createInternalScreenshotUrl(id);
  if (!signedUrl) return new Response("Captura não encontrada.", { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
