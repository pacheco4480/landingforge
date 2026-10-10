import { describe, expect, it } from "vitest";

import { BackupType } from "@/generated/prisma/client";
import { backupCreateSchema } from "@/features/backups/schemas/backup.schema";

describe("backup schema", () => {
  it("defaults to manual backup type", () => {
    const parsed = backupCreateSchema.parse({});
    expect(parsed.type).toBe(BackupType.MANUAL);
  });
});
