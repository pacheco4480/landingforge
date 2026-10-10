import { EmailDeliveryStatus } from "@/generated/prisma/client";
import { notificationSettingsSchema } from "@/features/email/schemas/email.schema";
import { getDigestOverview } from "@/features/email/services/digest-scheduler.service";
import { db } from "@/lib/db";

export async function getNotificationSettingsOverview() {
  return getDigestOverview();
}

export async function updateNotificationSettings(input: unknown, userId: string) {
  const data = notificationSettingsSchema.parse(input);
  const current = await getOrCreateClientSettings();
  const updated = await db.clientSetting.update({
    where: { id: current.id },
    data: {
      emailDigestFrequency: data.frequency,
      emailDigestHour: data.hour,
      emailDigestWeekday: data.weekday,
      timezone: data.timezone,
      emailDigestRecipient: data.recipient || null,
      emailDigestLastStatus:
        current.emailDigestLastStatus ?? EmailDeliveryStatus.PENDING,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "notification_settings.update",
      entityType: "client_setting",
      entityId: updated.id,
      oldValues: {
        frequency: current.emailDigestFrequency,
        hour: current.emailDigestHour,
      },
      newValues: {
        frequency: updated.emailDigestFrequency,
        hour: updated.emailDigestHour,
      },
    },
  });

  return updated;
}

async function getOrCreateClientSettings() {
  const current = await db.clientSetting.findFirst();
  if (current) return current;
  return db.clientSetting.create({ data: {} });
}
