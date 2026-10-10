"use server";

import { revalidatePath } from "next/cache";

import { updateNotificationSettings } from "@/features/settings/services/notification-settings.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updateNotificationSettingsAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  await updateNotificationSettings(
    {
      frequency: value(formData, "frequency"),
      hour: value(formData, "hour"),
      weekday: value(formData, "weekday"),
      timezone: value(formData, "timezone"),
      recipient: value(formData, "recipient"),
    },
    user.id,
  );
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
