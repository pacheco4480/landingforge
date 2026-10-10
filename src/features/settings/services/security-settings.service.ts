import { securitySettingsSchema } from "@/features/settings/schemas/security-settings.schema";
import { getSecurityEventSummary } from "@/lib/security/security-event.service";
import { getSecuritySettings } from "@/lib/security/security-settings.service";
import { db } from "@/lib/db";

export async function getSecuritySettingsWorkspace() {
  const [settings, summary] = await Promise.all([
    getSecuritySettings(),
    getSecurityEventSummary(),
  ]);
  return { settings, summary };
}

export async function updateSecuritySettings(input: unknown, userId: string) {
  const data = securitySettingsSchema.parse(input);
  const current = await getSecuritySettings();
  const updated = await db.securitySetting.update({
    where: { id: current.id },
    data: {
      ...data,
      turnstileSiteKey: data.turnstileSiteKey || null,
    },
  });
  await db.auditLog.create({
    data: {
      userId,
      action: "security_settings.update",
      entityType: "security_setting",
      entityId: updated.id,
      oldValues: {
        turnstileEnabled: current.turnstileEnabled,
      },
      newValues: {
        turnstileEnabled: updated.turnstileEnabled,
      },
    },
  });
  return updated;
}
