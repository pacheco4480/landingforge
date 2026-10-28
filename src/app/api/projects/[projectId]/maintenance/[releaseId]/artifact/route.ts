import { NextResponse } from "next/server";

import { projectIdSchema } from "@/features/projects/schemas/project.schema";
import { downloadMaintenanceRelease } from "@/features/projects/services/project-maintenance.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(_request: Request, context: { params: Promise<{ projectId: string; releaseId: string }> }) {
  try {
    const actor = await requirePermission(permissions.projectsWrite);
    const { projectId, releaseId } = await context.params;
    const { id } = projectIdSchema.parse({ id: projectId });
    const built = await downloadMaintenanceRelease(id, releaseId, actor);
    const archiveBody = built.archive.buffer.slice(built.archive.byteOffset, built.archive.byteOffset + built.archive.byteLength) as ArrayBuffer;
    return new Response(archiveBody, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="landingforge-maintenance-${releaseId}.zip"`,
        "Content-Length": String(built.archive.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Artifact-Checksum": built.checksum,
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível entregar o pacote de manutenção. Volta a validar a release e confirma o acesso ao projeto." }, { status: 422 });
  }
}
