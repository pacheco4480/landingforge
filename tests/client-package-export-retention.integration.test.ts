import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.CLIENT_PACKAGE_TEST_DATABASE_URL;
const integration = describe.skipIf(!databaseUrl);

integration("client package export history and expiry against disposable PostgreSQL", () => {
  let db: typeof import("@/lib/db")["db"];
  let userId: string;
  let clientId: string;
  let projectId: string;
  let expiredExportId: string;
  let activeExportId: string;

  beforeAll(async () => {
    if (!databaseUrl) return;
    const target = new URL(databaseUrl);
    const databaseName = decodeURIComponent(target.pathname.slice(1)).toLowerCase();
    if (!(target.hostname === "localhost" || target.hostname === "127.0.0.1") || !databaseName.includes("test")) {
      throw new Error("O teste exige uma BD PostgreSQL local descartável com 'test' no nome.");
    }

    ({ db } = await import("@/lib/db"));
    const suffix = randomUUID();
    const user = await db.user.create({
      data: { email: `export-test-${suffix}@example.test`, name: "Export Test", passwordHash: "not-a-login-hash" },
      select: { id: true },
    });
    userId = user.id;
    const client = await db.client.create({
      data: { name: "Synthetic Test Client", businessName: `Export Test ${suffix}` },
      select: { id: true },
    });
    clientId = client.id;
    const project = await db.project.create({
      data: { clientId, name: "Synthetic Export Test Project", deliveryMode: "LANDING_ONLY" },
      select: { id: true },
    });
    projectId = project.id;

    const base = {
      projectId,
      createdByUserId: userId,
      status: "READY" as const,
      mode: "LANDING_ONLY" as const,
      templateVersion: "test-template@1.0.0",
      auditReport: { version: 1, ready: true },
      fileCount: 1,
      totalBytes: 42,
    };
    const expired = await db.clientPackageExport.create({
      data: { ...base, expiresAt: new Date(Date.now() - 60_000) },
      select: { id: true },
    });
    const active = await db.clientPackageExport.create({
      data: { ...base, expiresAt: new Date(Date.now() + 86_400_000) },
      select: { id: true },
    });
    expiredExportId = expired.id;
    activeExportId = active.id;
  }, 30_000);

  afterAll(async () => {
    if (!db) return;
    if (projectId) await db.project.deleteMany({ where: { id: projectId } });
    if (clientId) await db.client.deleteMany({ where: { id: clientId } });
    if (userId) await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("removes expired records and returns only active history scoped to the project", async () => {
    const { listClientPackageExports } = await import("@/features/exports/services/client-package-export.service");
    const history = await listClientPackageExports(projectId, { id: userId, roles: ["super_admin"] });

    expect(history.map((entry) => entry.id)).toEqual([activeExportId]);
    await expect(db.clientPackageExport.findUnique({ where: { id: expiredExportId } })).resolves.toBeNull();
    await expect(db.clientPackageExport.findUnique({ where: { id: activeExportId } })).resolves.toMatchObject({ projectId });
  });
});
