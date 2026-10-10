import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function recordAuthEvent(
  action: string,
  userId?: string,
  details?: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      action,
      entityType: "user",
      entityId: userId,
      newValues: details as Prisma.InputJsonValue | undefined,
      userId,
    },
  });
}
