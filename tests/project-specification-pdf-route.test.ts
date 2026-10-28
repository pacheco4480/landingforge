import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exportProjectSpecificationPdf,
  requirePermission,
  checkRateLimit,
  ProjectSpecificationChangedError,
} = vi.hoisted(() => {
  class ProjectSpecificationChangedError extends Error {}
  return {
    exportProjectSpecificationPdf: vi.fn(),
    requirePermission: vi.fn(),
    checkRateLimit: vi.fn(),
    ProjectSpecificationChangedError,
  };
});

vi.mock("@/features/briefings/briefing.service", () => ({
  exportProjectSpecificationPdf,
  ProjectSpecificationChangedError,
}));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission }));
vi.mock("@/lib/security/rate-limiter", () => ({ checkRateLimit }));

import { GET } from "@/app/api/projects/[projectId]/specification.pdf/route";

const projectId = "950e8400-e29b-41d4-a716-446655440000";
const actor = { id: "operator-1", roles: ["super_admin"] };
const context = { params: Promise.resolve({ projectId }) };
const contentHash = "a".repeat(64);

describe("project specification PDF route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue(actor);
    checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    exportProjectSpecificationPdf.mockResolvedValue({
      pdf: Uint8Array.from([0x25, 0x50, 0x44, 0x46]),
      artifactChecksum: "b".repeat(64),
      version: 4,
    });
  });

  it("requires the export permission and serves a private PDF with a checksum", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${projectId}/specification.pdf?audience=client&contentHash=${contentHash}`,
    );
    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(requirePermission).toHaveBeenCalledWith("projects.export");
    expect(exportProjectSpecificationPdf).toHaveBeenCalledWith({
      projectId,
      audience: "client",
      expectedContentHash: contentHash,
      actor,
    });
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-artifact-sha256")).toBe("b".repeat(64));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      Uint8Array.from([0x25, 0x50, 0x44, 0x46]),
    );
  });

  it("returns 429 without generating a file when the rate limit is reached", async () => {
    checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 30,
    });
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${projectId}/specification.pdf?contentHash=${contentHash}`,
    );

    const response = await GET(request, context);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(exportProjectSpecificationPdf).not.toHaveBeenCalled();
  });

  it("requires a fresh preview when the specification hash is stale", async () => {
    exportProjectSpecificationPdf.mockRejectedValueOnce(
      new ProjectSpecificationChangedError("stale"),
    );
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${projectId}/specification.pdf?audience=internal&contentHash=${contentHash}`,
    );

    const response = await GET(request, context);

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain(
      "Gera uma nova pré-visualização",
    );
  });

  it("does not export when authorization fails", async () => {
    requirePermission.mockRejectedValueOnce(new Error("unauthorized"));
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${projectId}/specification.pdf?contentHash=${contentHash}`,
    );

    const response = await GET(request, context);

    expect(response.status).toBe(404);
    expect(exportProjectSpecificationPdf).not.toHaveBeenCalled();
  });
});
