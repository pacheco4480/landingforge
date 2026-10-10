import {
  EmailDeliveryStatus,
  EmailDigestFrequency,
} from "@/generated/prisma/client";
import { sendNotificationDigest } from "@/features/email/services/notification-digest.service";
import { db } from "@/lib/db";

export async function runDueDigestNotifications(now = new Date()) {
  const settings = await getOrCreateClientSettings();
  if (settings.emailDigestFrequency === EmailDigestFrequency.DISABLED) {
    return { attempted: 0, sent: 0, skipped: "disabled" as const };
  }
  if (!isDueNow(settings, now)) {
    return { attempted: 0, sent: 0, skipped: "not_due" as const };
  }
  if (wasAlreadySentForWindow(settings.emailDigestLastSentAt, now, settings.emailDigestFrequency)) {
    return { attempted: 0, sent: 0, skipped: "duplicate" as const };
  }

  const site = await db.siteSetting.findFirst({
    select: { contactEmail: true },
  });
  const recipient = settings.emailDigestRecipient ?? site?.contactEmail;
  if (!recipient) {
    await updateDigestStatus(EmailDeliveryStatus.FAILED, null);
    return { attempted: 1, sent: 0, skipped: "missing_recipient" as const };
  }

  const result = await sendNotificationDigest({
    recipient,
    frequency: settings.emailDigestFrequency,
  });

  if (result.skipped === "empty") {
    return { attempted: 1, sent: 0, skipped: "empty" as const };
  }

  await updateDigestStatus(result.status, result.sent ? now : null);
  return { attempted: 1, sent: result.sent ? 1 : 0 };
}

export async function getDigestOverview(now = new Date()) {
  const settings = await getOrCreateClientSettings();
  return {
    frequency: settings.emailDigestFrequency,
    hour: settings.emailDigestHour,
    weekday: settings.emailDigestWeekday,
    timezone: settings.timezone,
    recipient: settings.emailDigestRecipient,
    lastSentAt: settings.emailDigestLastSentAt,
    lastStatus: settings.emailDigestLastStatus,
    nextRunAt:
      settings.emailDigestFrequency === EmailDigestFrequency.DISABLED
        ? null
        : getNextRunAt(settings, now),
  };
}

export async function getOrCreateClientSettings() {
  const current = await db.clientSetting.findFirst();
  if (current) return current;
  return db.clientSetting.create({ data: {} });
}

function isDueNow(
  settings: Awaited<ReturnType<typeof getOrCreateClientSettings>>,
  now: Date,
) {
  if (settings.timezone !== "Europe/Lisbon") return false;
  if (now.getHours() !== settings.emailDigestHour) return false;
  if (settings.emailDigestFrequency === EmailDigestFrequency.WEEKLY) {
    return now.getDay() === settings.emailDigestWeekday;
  }
  if (settings.emailDigestFrequency === EmailDigestFrequency.MONTHLY) {
    return now.getDate() === 1;
  }
  return settings.emailDigestFrequency === EmailDigestFrequency.DAILY;
}

function wasAlreadySentForWindow(
  lastSentAt: Date | null,
  now: Date,
  frequency: EmailDigestFrequency,
) {
  if (!lastSentAt) return false;
  if (frequency === EmailDigestFrequency.DAILY) {
    return lastSentAt.toDateString() === now.toDateString();
  }
  if (frequency === EmailDigestFrequency.WEEKLY) {
    return getWeekKey(lastSentAt) === getWeekKey(now);
  }
  return (
    lastSentAt.getFullYear() === now.getFullYear() &&
    lastSentAt.getMonth() === now.getMonth()
  );
}

function getNextRunAt(
  settings: Awaited<ReturnType<typeof getOrCreateClientSettings>>,
  now: Date,
) {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(settings.emailDigestHour);

  if (settings.emailDigestFrequency === EmailDigestFrequency.DAILY) {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (settings.emailDigestFrequency === EmailDigestFrequency.WEEKLY) {
    const dayDiff = (settings.emailDigestWeekday - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + dayDiff);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  }

  next.setDate(1);
  if (next <= now) next.setMonth(next.getMonth() + 1);
  return next;
}

async function updateDigestStatus(
  status: EmailDeliveryStatus,
  lastSentAt: Date | null,
) {
  const settings = await getOrCreateClientSettings();
  await db.clientSetting.update({
    where: { id: settings.id },
    data: {
      emailDigestLastStatus: status,
      emailDigestLastSentAt: lastSentAt ?? settings.emailDigestLastSentAt,
    },
  });
}

function getWeekKey(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return `${date.getFullYear()}-${Math.ceil((days + start.getDay() + 1) / 7)}`;
}
