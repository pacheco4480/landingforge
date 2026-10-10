import * as Sentry from "@sentry/nextjs";

import {
  Prisma,
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import {
  errorMessage,
  monitoringFingerprint,
  sanitizeError,
  sanitizeMonitoringMetadata,
} from "@/features/monitoring/services/sanitize.service";
import { db } from "@/lib/db";

export type MonitoringLogInput = {
  level: SystemLogLevel;
  source: SystemLogSource;
  error?: unknown;
  message?: string;
  userId?: string | null;
  path?: string | null;
  action?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logMonitoringEvent(input: MonitoringLogInput) {
  const message = input.message ?? errorMessage(input.error);
  const fingerprint = monitoringFingerprint({
    source: input.source,
    action: input.action,
    message,
  });
  const metadata = sanitizeMonitoringMetadata({
    ...(input.metadata ?? {}),
    error: input.error ? sanitizeError(input.error) : undefined,
  }) as Prisma.InputJsonValue;

  captureSentryEvent({ ...input, message, fingerprint, metadata });

  try {
    await db.systemErrorLog.create({
      data: {
        level: input.level,
        source: input.source,
        message,
        fingerprint,
        userId: input.userId ?? null,
        path: input.path ?? null,
        action: input.action ?? null,
        requestId: input.requestId ?? null,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
        metadata,
      },
    });
  } catch (logError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to persist monitoring event.", logError);
    }
  }
}

export function captureSentryEvent(
  input: Omit<MonitoringLogInput, "metadata"> & {
    message: string;
    fingerprint: string;
    metadata: Prisma.InputJsonValue;
  },
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    scope.setLevel(toSentryLevel(input.level));
    scope.setFingerprint([input.fingerprint]);
    scope.setTag("source", input.source);
    if (input.action) scope.setTag("action", input.action);
    if (input.path) scope.setContext("request", { path: input.path });
    if (input.userId) scope.setUser({ id: input.userId });
    scope.setContext("metadata", input.metadata as Record<string, unknown>);

    if (input.error instanceof Error) {
      Sentry.captureException(input.error);
      return;
    }

    Sentry.captureMessage(input.message);
  });
}

function toSentryLevel(level: SystemLogLevel) {
  switch (level) {
    case SystemLogLevel.CRITICAL:
      return "fatal";
    case SystemLogLevel.ERROR:
      return "error";
    case SystemLogLevel.WARNING:
      return "warning";
    case SystemLogLevel.INFO:
      return "info";
  }
}
