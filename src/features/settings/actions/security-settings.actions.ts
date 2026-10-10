"use server";

import { revalidatePath } from "next/cache";

import { updateSecuritySettings } from "@/features/settings/services/security-settings.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updateSecuritySettingsAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  await updateSecuritySettings(
    {
      turnstileEnabled: formData.has("turnstileEnabled"),
      turnstileSiteKey: value(formData, "turnstileSiteKey"),
      honeypotEnabled: formData.has("honeypotEnabled"),
      duplicateCooldownSeconds: value(formData, "duplicateCooldownSeconds"),
      loginLimitPerMinute: value(formData, "loginLimitPerMinute"),
      passwordResetLimitPerHour: value(formData, "passwordResetLimitPerHour"),
      formLimitPerMinute: value(formData, "formLimitPerMinute"),
      uploadLimitPerMinute: value(formData, "uploadLimitPerMinute"),
      apiLimitPerMinute: value(formData, "apiLimitPerMinute"),
    },
    user.id,
  );
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
