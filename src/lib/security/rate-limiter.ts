import type { RateLimitContext, RateLimitResult } from "@/lib/security/rate-limit";
import { SecurityEventType } from "@/generated/prisma/client";
import { getSecuritySettings } from "@/lib/security/security-settings.service";
import {
  hashSecurityKey,
  recordSecurityEvent,
} from "@/lib/security/security-event.service";
import { db } from "@/lib/db";

const actionConfig = {
  login: { windowSeconds: 60, limitKey: "loginLimitPerMinute" },
  "password-reset": { windowSeconds: 60 * 60, limitKey: "passwordResetLimitPerHour" },
  "form-submit": { windowSeconds: 60, limitKey: "formLimitPerMinute" },
  "media-upload": { windowSeconds: 60, limitKey: "uploadLimitPerMinute" },
  api: { windowSeconds: 60, limitKey: "apiLimitPerMinute" },
} as const;

export async function checkRateLimit(
  context: RateLimitContext & { ipAddress?: string | null; userAgent?: string | null },
): Promise<RateLimitResult> {
  const settings = await getSecuritySettings();
  const config = actionConfig[context.action];
  const limit = Number(settings[config.limitKey]);
  const since = new Date(Date.now() - config.windowSeconds * 1000);
  const keyHash = hashSecurityKey(`${context.action}:${context.key}`);
  const count = await db.securityEvent.count({
    where: {
      scope: context.action,
      keyHash,
      createdAt: { gte: since },
    },
  });

  if (count >= limit) {
    await recordSecurityEvent({
      type: SecurityEventType.RATE_LIMIT,
      scope: context.action,
      key: `${context.action}:${context.key}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { limit, windowSeconds: config.windowSeconds },
    });
    return { allowed: false, retryAfterSeconds: config.windowSeconds };
  }

  return { allowed: true };
}

export async function assertRateLimit(
  context: RateLimitContext & { ipAddress?: string | null; userAgent?: string | null },
) {
  const result = await checkRateLimit(context);
  if (!result.allowed) {
    throw new Error(`Demasiadas tentativas. Tenta novamente em ${result.retryAfterSeconds} segundos.`);
  }
}
