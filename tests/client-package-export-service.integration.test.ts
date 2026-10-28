import { randomUUID } from "node:crypto";
import { unzipSync } from "fflate";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { requirePermission } = vi.hoisted(() => ({ requirePermission: vi.fn() }));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission }));

const databaseUrl = process.env.CLIENT_PACKAGE_TEST_DATABASE_URL;
const integration = describe.skipIf(!databaseUrl);
const localTestImage = "/screenshots/template-restaurant-playful.png";

function localizeImageAssets(value: unknown, key = ""): unknown {
  if (typeof value === "string") {
    return /(?:image|photo|logo|avatar|portrait|gallery|media|background|thumbnail|cover|src)/i.test(key)
      && value.startsWith("https://")
      ? localTestImage
      : value;
  }
  if (Array.isArray(value)) return value.map((item) => localizeImageAssets(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, localizeImageAssets(child, childKey)]));
  }
  return value;
}

integration("Master Project provisioning and Landing Only export against disposable PostgreSQL", () => {
  let db: typeof import("@/lib/db")["db"];
  let actorId: string;
  let clientId: string;
  let projectId: string;

  beforeAll(async () => {
    if (!databaseUrl) return;
    const target = new URL(databaseUrl);
    const databaseName = decodeURIComponent(target.pathname.slice(1)).toLowerCase();
    if (!(target.hostname === "localhost" || target.hostname === "127.0.0.1") || !databaseName.includes("test")) {
      throw new Error("O teste exige uma BD PostgreSQL local descartável com 'test' no nome.");
    }

    ({ db } = await import("@/lib/db"));
    const sourcePages = await db.page.findMany({
      where: {
        isDemo: true,
        status: "PUBLISHED",
        demoStatus: { in: ["READY", "PUBLISHED"] },
        deletedAt: null,
        template: { key: "restaurant" },
        templateVariant: { key: "playful" },
      },
      select: { id: true, templateId: true, templateVariantId: true },
      take: 2,
    });
    if (sourcePages.length !== 1 || !sourcePages[0].templateId || !sourcePages[0].templateVariantId) {
      throw new Error(`Esperava exatamente uma demo Restaurant Playful aprovada; encontrei ${sourcePages.length}.`);
    }

    const suffix = randomUUID();
    const actor = await db.user.create({
      data: { email: `export-operator-${suffix}@example.test`, name: "Synthetic Export Operator", passwordHash: "not-a-login-hash" },
      select: { id: true },
    });
    actorId = actor.id;
    const client = await db.client.create({
      data: { name: "Synthetic Export Client", businessName: `Export Test ${suffix}`, email: `client-${suffix}@example.test` },
      select: { id: true },
    });
    clientId = client.id;
    const project = await db.project.create({
      data: {
        clientId,
        name: "Synthetic Landing Only Export",
        templateId: sourcePages[0].templateId,
        templateVariantId: sourcePages[0].templateVariantId,
        deliveryMode: "LANDING_ONLY",
      },
      select: { id: true },
    });
    projectId = project.id;
  }, 30_000);

  afterAll(async () => {
    // Provisioning writes immutable audit events; the harness drops this disposable database.
    await db?.$disconnect();
  });

  it("provisions a private snapshot, creates an audited ZIP and persists only scoped metadata", async () => {
    const actor = { id: actorId, roles: ["super_admin"] };
    const { provisionProjectSource } = await import("@/features/projects/services/project-provisioning.service");
    const { GET, POST } = await import("@/app/api/projects/[projectId]/exports/route");
    const provisioned = await provisionProjectSource(projectId, actor);
    expect(provisioned.slug).toBe(`project-${projectId}`);

    const projectPage = await db.page.findUniqueOrThrow({
      where: { id: provisioned.id },
      include: { theme: true, sections: { where: { deletedAt: null } } },
    });
    for (const section of projectPage.sections) {
      await db.pageSection.update({
        where: { id: section.id },
        data: { content: localizeImageAssets(section.content) as never },
      });
    }
    if (projectPage.theme) {
      await db.theme.update({
        where: { id: projectPage.theme.id },
        data: { settings: localizeImageAssets(projectPage.theme.settings) as never },
      });
    }

    requirePermission.mockResolvedValue(actor);
    const request = new NextRequest(`http://localhost/api/projects/${projectId}/exports`, {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ acknowledgeLegalReview: true, mode: "LANDING_ONLY" }),
    });
    const response = await POST(request, { params: Promise.resolve({ projectId }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    const exportId = response.headers.get("x-export-id");
    const checksum = response.headers.get("x-export-checksum");
    expect(exportId).toBeTruthy();
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    const archiveFiles = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const paths = Object.keys(archiveFiles);
    expect(paths).toContain(".env.example");
    expect(paths.some((path) => path === ".env" || /(?:^|\/)(?:docs|tasks|prompts|crm)(?:\/|$)/i.test(path))).toBe(false);

    const historyResponse = await GET(new NextRequest(`http://localhost/api/projects/${projectId}/exports`), {
      params: Promise.resolve({ projectId }),
    });
    expect(historyResponse.status).toBe(200);
    const { exports: history } = await historyResponse.json() as { exports: Array<Record<string, unknown>> };
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: exportId,
      mode: "LANDING_ONLY",
      status: "READY",
      artifactChecksum: checksum,
    });
    expect(new Date(String(history[0].expiresAt)).getTime()).toBeGreaterThan(Date.now());
    await expect(db.clientPackageExport.findUnique({ where: { id: exportId! } })).resolves.toMatchObject({ projectId });
  }, 540_000);

  it("denies an unassigned actor before creating or listing export records", async () => {
    const { GET, POST } = await import("@/app/api/projects/[projectId]/exports/route");
    const historyCountBefore = await db.clientPackageExport.count({ where: { projectId } });
    requirePermission.mockRejectedValue(new Error("forbidden"));

    const historyResponse = await GET(new NextRequest(`http://localhost/api/projects/${projectId}/exports`), {
      params: Promise.resolve({ projectId }),
    });
    expect(historyResponse.status).toBe(404);
    const exportResponse = await POST(new NextRequest(`http://localhost/api/projects/${projectId}/exports`, {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ acknowledgeLegalReview: true, mode: "LANDING_ONLY" }),
    }), { params: Promise.resolve({ projectId }) });
    expect(exportResponse.status).toBe(400);
    expect(await db.clientPackageExport.count({ where: { projectId } })).toBe(historyCountBefore);
  });
});
