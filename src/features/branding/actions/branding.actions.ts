"use server";

import { revalidatePath } from "next/cache";

import {
  resetBrandColors,
  updateBrandAsset,
  updateBrandingSettings,
} from "@/features/branding/services/branding.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updateBrandingAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  await updateBrandingSettings(
    {
      businessName: value(formData, "businessName"),
      siteName: value(formData, "siteName"),
      businessType: value(formData, "businessType"),
      contactEmail: value(formData, "contactEmail"),
      contactPhone: value(formData, "contactPhone"),
      address: value(formData, "address"),
      whatsappUrl: value(formData, "whatsappUrl"),
      facebookUrl: value(formData, "facebookUrl"),
      instagramUrl: value(formData, "instagramUrl"),
      linkedinUrl: value(formData, "linkedinUrl"),
      primaryColor: value(formData, "primaryColor"),
      secondaryColor: value(formData, "secondaryColor"),
      accentColor: value(formData, "accentColor"),
    },
    user.id,
  );
  revalidatePath("/branding");
  revalidatePublicPage();
}

export async function updateBrandAssetAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);
  const asset = value(formData, "asset") === "favicon" ? "favicon" : "logo";
  const mediaId = value(formData, "mediaId") || null;
  await updateBrandAsset(asset, mediaId, user.id);
  revalidatePath("/branding");
  revalidatePublicPage();
}

export async function resetBrandColorsAction() {
  const user = await requirePermission(permissions.settingsWrite);
  await resetBrandColors(user.id);
  revalidatePath("/branding");
  revalidatePublicPage();
}
