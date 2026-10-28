import { PrivacyRequestStatus } from "@/generated/prisma/client";

export const privacyExtensionChannels = ["email", "phone", "secure_channel", "other"] as const;

export const privacyStatusTransitions: Record<PrivacyRequestStatus, PrivacyRequestStatus[]> = {
  [PrivacyRequestStatus.RECEIVED]: [PrivacyRequestStatus.VERIFYING, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.VERIFYING]: [PrivacyRequestStatus.VERIFIED, PrivacyRequestStatus.REVIEW, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.VERIFIED]: [PrivacyRequestStatus.REVIEW, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.REVIEW]: [PrivacyRequestStatus.APPROVED, PrivacyRequestStatus.PARTIALLY_COMPLETED, PrivacyRequestStatus.DECLINED, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.APPROVED]: [PrivacyRequestStatus.IN_PROGRESS, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.IN_PROGRESS]: [PrivacyRequestStatus.COMPLETED, PrivacyRequestStatus.PARTIALLY_COMPLETED, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.COMPLETED]: [PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.PARTIALLY_COMPLETED]: [PrivacyRequestStatus.IN_PROGRESS, PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.DECLINED]: [PrivacyRequestStatus.CLOSED],
  [PrivacyRequestStatus.CLOSED]: [],
};

export function retentionCutoffDate(days: number, from = new Date()) {
  const cutoff = new Date(from);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

export function defaultPrivacyRequestDueDate(receivedAt: Date) {
  return addCalendarMonths(receivedAt, 1);
}

export function maximumPrivacyRequestDueDate(receivedAt: Date) {
  return addCalendarMonths(defaultPrivacyRequestDueDate(receivedAt), 2);
}

export function utcDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addCalendarMonths(date: Date, months: number) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDayOfTargetMonth)));
}
