import { createHash } from "node:crypto";

import { Prisma, SecurityEventType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export function hashSecurityKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function recordSecurityEvent(input: {
  type: SecurityEventType;
  scope: string;
  key?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.securityEvent.create({
    data: {
      type: input.type,
      scope: input.scope,
      keyHash: input.key ? hashSecurityKey(input.key) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getSecurityEventSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [blocked, rateLimited, spam, turnstileFailed, latest] =
    await Promise.all([
      db.securityEvent.count({ where: { createdAt: { gte: since } } }),
      db.securityEvent.count({
        where: { type: SecurityEventType.RATE_LIMIT, createdAt: { gte: since } },
      }),
      db.securityEvent.count({
        where: { type: SecurityEventType.SPAM_DETECTED, createdAt: { gte: since } },
      }),
      db.securityEvent.count({
        where: {
          type: SecurityEventType.TURNSTILE_FAILED,
          createdAt: { gte: since },
        },
      }),
      db.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
  return { blocked, rateLimited, spam, turnstileFailed, latest };
}
