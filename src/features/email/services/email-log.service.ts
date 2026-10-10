import {
  EmailDeliveryStatus,
  EmailType,
  Prisma,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function createEmailLog(input: {
  type: EmailType;
  recipient: string;
  subject: string;
  metadata?: Record<string, unknown>;
}) {
  return db.emailLog.create({
    data: {
      type: input.type,
      recipient: input.recipient,
      subject: input.subject,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function markEmailSent(id: string, providerId?: string | null) {
  return db.emailLog.update({
    where: { id },
    data: {
      status: EmailDeliveryStatus.SENT,
      providerId,
      sentAt: new Date(),
    },
  });
}

export async function markEmailFailed(id: string, error: unknown) {
  return db.emailLog.update({
    where: { id },
    data: {
      status: EmailDeliveryStatus.FAILED,
      errorMessage: normalizeEmailError(error),
    },
  });
}

export function normalizeEmailError(error: unknown) {
  if (error instanceof Error && error.message) return error.message.slice(0, 500);
  if (typeof error === "string") return error.slice(0, 500);
  return "Unknown email delivery error.";
}

export async function countSentEmailsToday() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return db.emailLog.count({
    where: {
      status: EmailDeliveryStatus.SENT,
      createdAt: { gte: today },
    },
  });
}

export async function findLatestEmailLog(type?: EmailType) {
  return db.emailLog.findFirst({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
