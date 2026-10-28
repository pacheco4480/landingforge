import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { getClientsWorkspace } from "@/features/clients/services/client.service";
import { db } from "@/lib/db";

const enabled = process.env.RUN_CLIENT_LIST_DB_INTEGRATION === "1";
const databaseName = process.env.DATABASE_URL
  ? decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1))
  : "";
const safeDatabase = /(?:^|[_-])test(?:[_-]|$)/i.test(databaseName);
const fixtures: { userId?: string; clientIds: string[]; projectIds: string[] } =
  {
    clientIds: [],
    projectIds: [],
  };

describe("client list PostgreSQL integration", () => {
  it.skipIf(!enabled)(
    "keeps actor scope in search/count and paginates at 50",
    async () => {
      if (!safeDatabase) {
        throw new Error(
          "Client-list integration tests require a database name containing 'test'.",
        );
      }

      const suffix = randomUUID();
      const user = await db.user.create({
        data: {
          name: "TASK 045 client list test",
          email: `task045-client-list-${suffix}@example.test`,
        },
        select: { id: true },
      });
      fixtures.userId = user.id;

      const pageClients = await Promise.all(
        Array.from({ length: 51 }, (_, index) =>
          db.client.create({
            data: {
              name: `Pagination contact ${index}`,
              businessName: `Pagination ${suffix} ${index}`,
              industry: "Clinic",
            },
            select: { id: true },
          }),
        ),
      );
      fixtures.clientIds.push(...pageClients.map((client) => client.id));

      const visibleClient = await db.client.create({
        data: {
          name: "Visible contact",
          businessName: `Access ${suffix} visible`,
          industry: "Clinic",
        },
        select: { id: true },
      });
      const hiddenClient = await db.client.create({
        data: {
          name: "Hidden contact",
          businessName: `Access ${suffix} hidden`,
          industry: "Clinic",
        },
        select: { id: true },
      });
      fixtures.clientIds.push(visibleClient.id, hiddenClient.id);

      const project = await db.project.create({
        data: { clientId: visibleClient.id, name: `Assigned ${suffix}` },
        select: { id: true },
      });
      const unassignedProject = await db.project.create({
        data: { clientId: visibleClient.id, name: `Unassigned ${suffix}` },
        select: { id: true },
      });
      fixtures.projectIds.push(project.id, unassignedProject.id);
      await db.projectAssignment.create({
        data: { projectId: project.id, userId: user.id },
      });

      const firstPage = await getClientsWorkspace(
        { id: user.id, roles: ["super_admin"] },
        {
          query: `Pagination ${suffix}`,
          page: 1,
        },
      );
      const secondPage = await getClientsWorkspace(
        { id: user.id, roles: ["super_admin"] },
        {
          query: `Pagination ${suffix}`,
          page: 2,
        },
      );
      expect(firstPage).toMatchObject({
        pagination: { page: 1, pageSize: 50, total: 51, totalPages: 2 },
      });
      expect(firstPage.clients).toHaveLength(50);
      expect(secondPage).toMatchObject({
        pagination: { page: 2, total: 51, totalPages: 2 },
      });
      expect(secondPage.clients).toHaveLength(1);

      const assignedActor = { id: user.id, roles: [] as string[] };
      const scopedSearch = await getClientsWorkspace(assignedActor, {
        query: `Access ${suffix}`,
      });
      expect(scopedSearch.pagination.total).toBe(1);
      expect(scopedSearch.clients.map((client) => client.id)).toEqual([
        visibleClient.id,
      ]);
      expect(scopedSearch.clients[0]?._count.projects).toBe(1);
      const hiddenSearch = await getClientsWorkspace(assignedActor, {
        query: `Access ${suffix} hidden`,
      });
      expect(hiddenSearch.pagination.total).toBe(0);
      expect(hiddenSearch.clients).toHaveLength(0);
    },
  );
});

afterAll(async () => {
  if (fixtures.projectIds.length) {
    await db.project.deleteMany({ where: { id: { in: fixtures.projectIds } } });
  }
  if (fixtures.clientIds.length) {
    await db.client.deleteMany({ where: { id: { in: fixtures.clientIds } } });
  }
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
