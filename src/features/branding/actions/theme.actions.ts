"use server";

import { revalidatePath } from "next/cache";

import {
  applyThemeToPage,
  createTheme,
  duplicateTheme,
  updateTheme,
} from "@/features/branding/services/theme.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function themePayload(formData: FormData) {
  return {
    id: value(formData, "id") || undefined,
    name: value(formData, "name"),
    key: value(formData, "key"),
    primaryColor: value(formData, "primaryColor"),
    secondaryColor: value(formData, "secondaryColor"),
    accentColor: value(formData, "accentColor"),
    backgroundColor: value(formData, "backgroundColor"),
    surfaceColor: value(formData, "surfaceColor"),
    textPrimaryColor: value(formData, "textPrimaryColor"),
    textSecondaryColor: value(formData, "textSecondaryColor"),
    headingFont: value(formData, "headingFont"),
    bodyFont: value(formData, "bodyFont"),
    borderRadius: value(formData, "borderRadius"),
    shadowStyle: value(formData, "shadowStyle"),
  };
}

export async function saveThemeAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  if (value(formData, "id")) {
    await updateTheme(themePayload(formData), user.id);
  } else {
    await createTheme(themePayload(formData), user.id);
  }
  revalidatePath("/branding");
  revalidatePublicPage();
}

export async function duplicateThemeAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  await duplicateTheme(value(formData, "id"), user.id);
  revalidatePath("/branding");
  revalidatePublicPage();
}

export async function applyThemeAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  const pageId = value(formData, "pageId");
  await applyThemeToPage(
    value(formData, "themeId"),
    pageId,
    user.id,
  );
  revalidatePath("/branding");
  revalidatePublicPage();
}
