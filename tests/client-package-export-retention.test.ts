import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany } = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { clientPackageExport: { deleteMany } },
}));

import { purgeExpiredClientPackageExports } from "@/features/exports/services/client-package-export-retention";

describe("client package export retention", () => {
  beforeEach(() => vi.clearAllMocks());

  it("purges only export history whose expiry is at or before the supplied time", async () => {
    const now = new Date("2026-10-23T12:00:00.000Z");
    deleteMany.mockResolvedValueOnce({ count: 2 });

    await expect(purgeExpiredClientPackageExports(now)).resolves.toEqual({ count: 2 });
    expect(deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lte: now } } });
  });
});
