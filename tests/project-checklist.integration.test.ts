import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import {
  listProjectWorkspaceRecords,
  updateProjectChecklistItem,
} from "@/features/briefings/briefing.service";
import { db } from "@/lib/db";

const enabled = process.env.RUN_PROJECT_BRIEFING_DB_INTEGRATION === "1";
const fixtureIds: { projectId?: string; clientId?: string; userId?: string } =
  {};

describe("project checklist PostgreSQL integration", () => {
  it.skipIf(!enabled)("saves a project-scoped status and audits without storing its reference", async () => {
    const suffix = randomUUID();
    const user = await db.user.create({
      data: { name: "TASK 045 test", email: `task045-${suffix}@example.test` },
      select: { id: true },
    });
    fixtureIds.userId = user.id;
    const client = await db.client.create({
      data: {
        name: "TASK 045 test",
        businessName: "TASK 045 test",
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    fixtureIds.clientId = client.id;
    const project = await db.project.create({
      data: { name: "TASK 045 checklist integration", clientId: client.id },
      select: { id: true },
    });
    fixtureIds.projectId = project.id;

    await updateProjectChecklistItem({
      projectId: project.id,
      key: "PAYMENT",
      status: "COMPLETE",
      reference: "TEST-REF-045",
      actor: { id: user.id, roles: ["super_admin"] },
    });

    const records = await listProjectWorkspaceRecords(project.id, {
      id: user.id,
      roles: ["super_admin"],
    });
    const payment = records.checklist.find(({ key }) => key === "PAYMENT");
    expect(payment).toMatchObject({ key: "PAYMENT", status: "COMPLETE" });
    expect(records.checklist).toHaveLength(7);
    const persisted = await db.projectChecklistItem.findUniqueOrThrow({
      where: { projectId_key: { projectId: project.id, key: "PAYMENT" } },
      select: { id: true },
    });
    const audit = await db.auditLog.findFirstOrThrow({
      where: {
        action: "project.checklist.update",
        entityId: persisted.id,
      },
      select: { newValues: true },
    });
    expect(JSON.stringify(audit.newValues)).not.toContain("TEST-REF-045");
  });
});

afterAll(async () => {
  if (fixtureIds.projectId)
    await db.project.deleteMany({ where: { id: fixtureIds.projectId } });
  if (fixtureIds.clientId)
    await db.client.deleteMany({ where: { id: fixtureIds.clientId } });
  if (fixtureIds.userId)
    await db.user.update({
      where: { id: fixtureIds.userId },
      data: {
        name: "Ator de teste removido",
        email: `removed-${fixtureIds.userId}@example.test`,
        deletedAt: new Date(),
      },
    });
  await db.$disconnect();
});
