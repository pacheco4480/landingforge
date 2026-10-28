import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { projectIdSchema } from "@/features/projects/schemas/project.schema";
import {
  exportProjectSpecificationPdf,
  ProjectSpecificationChangedError,
} from "@/features/briefings/briefing.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

const audienceSchema = z.enum(["internal", "client"]);
const contentHashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requirePermission(permissions.projectsExport);
    const { projectId: rawProjectId } = await context.params;
    const { id: projectId } = projectIdSchema.parse({ id: rawProjectId });
    const audience = audienceSchema.parse(
      request.nextUrl.searchParams.get("audience") ?? "client",
    );
    const expectedContentHash = contentHashSchema.parse(
      request.nextUrl.searchParams.get("contentHash"),
    );
    const limit = await checkRateLimit({
      action: "api",
      key: `project-specification-pdf:${user.id}:${projectId}`,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent"),
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Tenta novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const result = await exportProjectSpecificationPdf({
      projectId,
      audience,
      expectedContentHash,
      actor: user,
    });
    const body = result.pdf.buffer.slice(
      result.pdf.byteOffset,
      result.pdf.byteOffset + result.pdf.byteLength,
    ) as ArrayBuffer;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="landingforge-project-${projectId}.pdf"`,
        "Content-Length": String(result.pdf.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Artifact-SHA256": result.artifactChecksum,
      },
    });
  } catch (error) {
    if (error instanceof ProjectSpecificationChangedError) {
      return NextResponse.json(
        {
          error:
            "A especificação mudou. Gera uma nova pré-visualização antes de exportar.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível exportar a especificação deste projeto." },
      { status: 404 },
    );
  }
}
