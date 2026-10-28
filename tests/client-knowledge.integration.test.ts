import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import {
  createClientKnowledgeEntry,
  deleteClientKnowledgeEntry,
  listClientKnowledgeEntries,
  updateClientKnowledgeEntry,
} from "@/features/clients/services/client-knowledge.service";
import { db } from "@/lib/db";

const enabled = process.env.RUN_PROJECT_BRIEFING_DB_INTEGRATION === "1";
const fixtures: { clientId?: string; projectId?: string; otherClientId?: string; userId?: string } = {};

describe("client knowledge PostgreSQL integration", () => {
  it.skipIf(!enabled)("isolates entries by client/project and audits without note text", async () => {
    const suffix = randomUUID();
    const user = await db.user.create({
      data: { name: "TASK 045 knowledge test", email: `task045-knowledge-${suffix}@example.test` },
      select: { id: true },
    });
    fixtures.userId = user.id;
    const [client, otherClient] = await Promise.all([
      db.client.create({ data: { name: "Knowledge test", businessName: `Knowledge ${suffix}` }, select: { id: true } }),
      db.client.create({ data: { name: "Other test", businessName: `Other ${suffix}` }, select: { id: true } }),
    ]);
    fixtures.clientId = client.id;
    fixtures.otherClientId = otherClient.id;
    const project = await db.project.create({
      data: { clientId: client.id, name: "Knowledge project test" },
      select: { id: true },
    });
    fixtures.projectId = project.id;
    const actor = { id: user.id, roles: ["super_admin"] };
    const noteText = `Do not copy to AI ${suffix}`;
    const input = {
      clientId: client.id,
      projectId: project.id,
      category: "PREFERENCE" as const,
      title: "Tom de comunicação",
      content: noteText,
    };

    const created = await createClientKnowledgeEntry(input, actor);
    const visible = await listClientKnowledgeEntries(client.id, actor);
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ id: created.id, project: { name: "Knowledge project test" } });
    expect(await listClientKnowledgeEntries(otherClient.id, actor)).toHaveLength(0);
    const unassignedActor = { id: user.id, roles: [] as string[] };
    expect(await listClientKnowledgeEntries(client.id, unassignedActor)).toHaveLength(0);
    await expect(createClientKnowledgeEntry(input, unassignedActor)).rejects.toThrow();

    await expect(createClientKnowledgeEntry({ ...input, clientId: otherClient.id }, actor)).rejects.toThrow();

    const audit = await db.auditLog.findFirstOrThrow({
      where: { action: "client.knowledge.create", entityId: created.id },
      select: { newValues: true },
    });
    expect(JSON.stringify(audit.newValues)).not.toContain(noteText);

    await updateClientKnowledgeEntry(created.id, { ...input, content: "Atualizada" }, actor);
    expect((await listClientKnowledgeEntries(client.id, actor))[0]?.content).toBe("Atualizada");
    await deleteClientKnowledgeEntry(created.id, client.id, actor);
    expect(await listClientKnowledgeEntries(client.id, actor)).toHaveLength(0);
  });
});

afterAll(async () => {
  if (fixtures.projectId) await db.project.deleteMany({ where: { id: fixtures.projectId } });
  if (fixtures.clientId) await db.client.deleteMany({ where: { id: fixtures.clientId } });
  if (fixtures.otherClientId) await db.client.deleteMany({ where: { id: fixtures.otherClientId } });
  if (fixtures.userId) {
    await db.user.update({
      where: { id: fixtures.userId },
      data: {
        name: "Ator de teste removido",
        email: `removed-${fixtures.userId}@example.test`,
        deletedAt: new Date(),
      },
    });
  }
  await db.$disconnect();
});
