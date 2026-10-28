import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { projectIdSchema } from "@/features/projects/schemas/project.schema";
import { createLandingOnlyExport, createLandingWithCmsExport, listClientPackageExports } from "@/features/exports/services/client-package-export.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";
export const maxDuration = 300;
const exportRequestSchema = z.object({ acknowledgeLegalReview: z.literal(true), mode: z.enum(["LANDING_ONLY", "LANDING_WITH_CMS"]) }).strict();

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([request.nextUrl.origin, process.env.NEXT_PUBLIC_SITE_URL, process.env.AUTH_URL]
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try { return new URL(value).origin; } catch { return ""; }
    }));
  return allowed.has(origin);
}

export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requirePermission(permissions.projectsExport);
    const { projectId } = await context.params;
    const { id } = projectIdSchema.parse({ id: projectId });
    const exports = await listClientPackageExports(id, user);
    return NextResponse.json({ exports });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar as exportações deste projeto." }, { status: 404 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Pedido de origem não autorizada." }, { status: 403 });
  try {
    const user = await requirePermission(permissions.projectsExport);
    const { projectId } = await context.params;
    const { id } = projectIdSchema.parse({ id: projectId });
    const body = exportRequestSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Confirma a revisão dos avisos legais antes de gerar o pacote." }, { status: 400 });
    const result = body.data.mode === "LANDING_WITH_CMS"
      ? await createLandingWithCmsExport(id, user)
      : await createLandingOnlyExport(id, user);
    if (!result.ok) {
      return NextResponse.json({ error: result.code, exportId: result.recordId, audit: result.audit }, { status: 422 });
    }

    const archive = result.package.archive;
    const archiveBody = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
    return new Response(archiveBody, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="landingforge-${result.recordId}.zip"`,
        "Content-Length": String(archive.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Id": result.recordId,
        "X-Export-Checksum": result.package.checksum,
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar o pacote. Confirma o acesso ao projeto e tenta novamente." }, { status: 400 });
  }
}
