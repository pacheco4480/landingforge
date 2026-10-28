import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createLandingOnlyExport, createLandingWithCmsExport, listClientPackageExports, requirePermission } = vi.hoisted(() => ({
  createLandingOnlyExport: vi.fn(),
  createLandingWithCmsExport: vi.fn(),
  listClientPackageExports: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("@/features/exports/services/client-package-export.service", () => ({
  createLandingOnlyExport,
  createLandingWithCmsExport,
  listClientPackageExports,
}));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission }));

import { GET, POST } from "@/app/api/projects/[projectId]/exports/route";

const projectId = "950e8400-e29b-41d4-a716-446655440000";
const actor = { id: "operator-1", roles: ["super_admin"] };
const context = { params: Promise.resolve({ projectId }) };

function postRequest(body: unknown, origin = "http://localhost:3000") {
  return new NextRequest(`http://localhost:3000/api/projects/${projectId}/exports`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("client package export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue(actor);
  });

  it("blocks a cross-origin export before permission or assembly", async () => {
    const response = await POST(postRequest({ acknowledgeLegalReview: true, mode: "LANDING_ONLY" }, "https://attacker.example"), context);

    expect(response.status).toBe(403);
    expect(requirePermission).not.toHaveBeenCalled();
    expect(createLandingOnlyExport).not.toHaveBeenCalled();
    expect(createLandingWithCmsExport).not.toHaveBeenCalled();
  });

  it("requires explicit legal acknowledgement and a valid delivery mode", async () => {
    const response = await POST(postRequest({ acknowledgeLegalReview: false, mode: "LANDING_ONLY" }), context);

    expect(response.status).toBe(400);
    expect(createLandingOnlyExport).not.toHaveBeenCalled();
    expect(createLandingWithCmsExport).not.toHaveBeenCalled();
  });

  it("does not assemble when the actor lacks export permission", async () => {
    requirePermission.mockRejectedValueOnce(new Error("forbidden"));

    const response = await POST(postRequest({ acknowledgeLegalReview: true, mode: "LANDING_ONLY" }), context);

    expect(response.status).toBe(400);
    expect(createLandingOnlyExport).not.toHaveBeenCalled();
  });

  it("dispatches the selected mode and streams a private, non-cacheable ZIP", async () => {
    const archive = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);
    createLandingWithCmsExport.mockResolvedValueOnce({
      ok: true,
      recordId: "export-1",
      package: { archive, checksum: "a".repeat(64) },
    });

    const response = await POST(postRequest({ acknowledgeLegalReview: true, mode: "LANDING_WITH_CMS" }), context);

    expect(response.status).toBe(200);
    expect(createLandingWithCmsExport).toHaveBeenCalledWith(projectId, actor);
    expect(createLandingOnlyExport).not.toHaveBeenCalled();
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-export-checksum")).toBe("a".repeat(64));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(archive);
  });

  it("returns the audit gate failure without streaming a package", async () => {
    createLandingOnlyExport.mockResolvedValueOnce({
      ok: false,
      recordId: "export-blocked",
      code: "AUDIT_BLOCKED",
      audit: { ready: false, findings: [{ code: "BUILD_NOT_VERIFIED", message: "Build independente não validado." }] },
    });

    const response = await POST(postRequest({ acknowledgeLegalReview: true, mode: "LANDING_ONLY" }), context);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("AUDIT_BLOCKED");
    expect(body.exportId).toBe("export-blocked");
    expect(createLandingOnlyExport).toHaveBeenCalledWith(projectId, actor);
  });

  it("returns history only after permission and delegates Project scoping to the service", async () => {
    listClientPackageExports.mockResolvedValueOnce([]);
    const request = new NextRequest(`http://localhost:3000/api/projects/${projectId}/exports`);

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(listClientPackageExports).toHaveBeenCalledWith(projectId, actor);
  });

  it("does not return export history when authorization fails", async () => {
    requirePermission.mockRejectedValueOnce(new Error("forbidden"));
    const request = new NextRequest(`http://localhost:3000/api/projects/${projectId}/exports`);

    const response = await GET(request, context);

    expect(response.status).toBe(404);
    expect(listClientPackageExports).not.toHaveBeenCalled();
  });
});
