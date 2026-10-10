import { brandingSchema } from "@/features/branding/schemas/branding.schema";
import type { BrandingInput } from "@/features/branding/schemas/branding.schema";
import { db } from "@/lib/db";

export const defaultBrandColors = {
  primaryColor: "#14532d",
  secondaryColor: "#0f766e",
  accentColor: "#f59e0b",
} as const;

export async function getBrandingSettings() {
  const settings = await db.siteSetting.findFirst({
    include: {
      logoMedia: true,
      faviconMedia: true,
    },
  });

  if (settings) return settings;

  return db.siteSetting.create({
    data: {
      siteName: "LandingForge",
      businessName: "LandingForge",
      businessType: "landing_page",
      contactEmail: "hello@example.com",
      ...defaultBrandColors,
    },
    include: {
      logoMedia: true,
      faviconMedia: true,
    },
  });
}

export async function updateBrandingSettings(input: unknown, userId: string) {
  const data = brandingSchema.parse(input);
  const current = await getBrandingSettings();

  const updated = await db.siteSetting.update({
    where: { id: current.id },
    data: {
      ...cleanBrandingInput(data),
    },
    include: {
      logoMedia: true,
      faviconMedia: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "branding.update",
      entityType: "site_setting",
      entityId: updated.id,
      oldValues: {
        businessName: current.businessName,
        primaryColor: current.primaryColor,
      },
      newValues: {
        businessName: updated.businessName,
        primaryColor: updated.primaryColor,
      },
    },
  });

  return updated;
}

export async function resetBrandColors(userId: string) {
  const current = await getBrandingSettings();
  const updated = await db.siteSetting.update({
    where: { id: current.id },
    data: defaultBrandColors,
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "branding.colors.reset",
      entityType: "site_setting",
      entityId: updated.id,
      oldValues: {
        primaryColor: current.primaryColor,
        secondaryColor: current.secondaryColor,
        accentColor: current.accentColor,
      },
      newValues: defaultBrandColors,
    },
  });

  return updated;
}

export async function updateBrandAsset(
  asset: "logo" | "favicon",
  mediaId: string | null,
  userId: string,
) {
  const current = await getBrandingSettings();
  const updated = await db.siteSetting.update({
    where: { id: current.id },
    data:
      asset === "logo" ? { logoMediaId: mediaId } : { faviconMediaId: mediaId },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: `branding.${asset}.update`,
      entityType: "site_setting",
      entityId: updated.id,
      newValues: { mediaId },
    },
  });
}

function cleanBrandingInput(data: BrandingInput) {
  return {
    ...data,
    contactPhone: data.contactPhone || null,
    address: data.address || null,
    whatsappUrl: data.whatsappUrl || null,
    facebookUrl: data.facebookUrl || null,
    instagramUrl: data.instagramUrl || null,
    linkedinUrl: data.linkedinUrl || null,
  };
}
