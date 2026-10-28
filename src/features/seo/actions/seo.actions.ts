"use server";

import { revalidatePath } from "next/cache";

import {
  generateStructuredDataForPage,
  updateLocalSeo,
  updateSeoSetting,
} from "@/features/seo/services/seo.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { permissions } from "@/features/rbac/permissions";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-permission";
import { getMaintenanceCandidateForPage, invalidateMaintenanceCandidate } from "@/features/projects/services/project-maintenance.service";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updateSeoSettingAction(formData: FormData) {
  const user = await requirePermission(permissions.seoWrite);
  const pageId = value(formData, "pageId");
  await getMaintenanceCandidateForPage(pageId, user);
  await updateSeoSetting(
    {
      pageId: value(formData, "pageId"),
      metaTitle: value(formData, "metaTitle"),
      metaDescription: value(formData, "metaDescription"),
      keywords: value(formData, "keywords"),
      canonicalUrl: value(formData, "canonicalUrl"),
      ogTitle: value(formData, "ogTitle"),
      ogDescription: value(formData, "ogDescription"),
      ogImageMediaId: value(formData, "ogImageMediaId"),
      twitterCardType: value(formData, "twitterCardType"),
      robotsIndex: formData.get("robotsIndex") === "on",
      robotsFollow: formData.get("robotsFollow") === "on",
      schemaJson: value(formData, "schemaJson"),
    },
    user.id,
  );
  revalidatePath("/seo");
  revalidatePath("/sitemap.xml");
  await invalidateMaintenanceCandidate(pageId);
  await revalidateSeoPage(pageId);
}

export async function generateStructuredDataAction(formData: FormData) {
  const user = await requirePermission(permissions.seoWrite);
  const pageId = value(formData, "pageId");
  await getMaintenanceCandidateForPage(pageId, user);
  await generateStructuredDataForPage(pageId, user.id);
  revalidatePath("/seo");
  await invalidateMaintenanceCandidate(pageId);
  await revalidateSeoPage(pageId);
}

export async function updateLocalSeoAction(formData: FormData) {
  const user = await requirePermission(permissions.seoWrite);
  await updateLocalSeo(
    {
      city: value(formData, "city"),
      region: value(formData, "region"),
      country: value(formData, "country"),
      postalCode: value(formData, "postalCode"),
      latitude: value(formData, "latitude"),
      longitude: value(formData, "longitude"),
      openingHours: value(formData, "openingHours"),
    },
    user.id,
  );
  revalidatePath("/seo");
  revalidatePublicPage();
}

async function revalidateSeoPage(pageId: string) {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { slug: true },
  });

  revalidatePublicPage(page?.slug);
}
