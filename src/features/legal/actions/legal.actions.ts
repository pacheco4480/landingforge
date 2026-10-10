"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { saveCookieConsent } from "@/features/legal/services/cookie-consent.service";
import {
  ensureLegalPages,
  saveLegalSettings,
} from "@/features/legal/services/legal-settings.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function saveCookieConsentAction(formData: FormData) {
  const requestHeaders = await headers();
  await saveCookieConsent(
    {
      consentId: value(formData, "consentId"),
      version: value(formData, "version"),
      necessary: true,
      analytics: formData.has("analytics"),
      marketing: formData.has("marketing"),
    },
    {
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
        undefined,
      userAgent: requestHeaders.get("user-agent") ?? undefined,
    },
  );
}

export async function saveLegalSettingsAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  await saveLegalSettings(
    {
      id: value(formData, "id") || undefined,
      consentVersion: value(formData, "consentVersion"),
      cookieBannerEnabled: formData.has("cookieBannerEnabled"),
      analyticsCookiesEnabled: formData.has("analyticsCookiesEnabled"),
      marketingCookiesEnabled: formData.has("marketingCookiesEnabled"),
      privacyPageId: value(formData, "privacyPageId"),
      cookiePageId: value(formData, "cookiePageId"),
      termsPageId: value(formData, "termsPageId"),
      retentionDays: value(formData, "retentionDays"),
      dataControllerName: value(formData, "dataControllerName"),
      dataControllerEmail: value(formData, "dataControllerEmail"),
    },
    user.id,
  );
  revalidatePath("/settings");
}

export async function ensureLegalPagesAction() {
  const user = await requirePermission(permissions.settingsWrite);
  await ensureLegalPages(user.id);
  revalidatePath("/settings");
}
