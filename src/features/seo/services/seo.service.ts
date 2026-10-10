import { Prisma } from "@/generated/prisma/client";
import { PageStatus } from "@/generated/prisma/client";
import { getEditablePageOptions } from "@/features/content/services/page.service";
import { getBrandingSettings } from "@/features/branding/services/branding.service";
import { localSeoSchema } from "@/features/seo/schemas/local-seo.schema";
import { seoSettingSchema } from "@/features/seo/schemas/seo.schema";
import {
  buildCanonicalUrl,
  getStructuredDataForPage,
  resolveCanonicalUrl,
} from "@/features/seo/services/seo-metadata.service";
import {
  getSeoScore,
  getSeoChecks,
} from "@/features/seo/services/seo-score.service";
import { db } from "@/lib/db";

export async function getSeoWorkspace(
  pageId: string | undefined,
  userRoles: readonly string[],
) {
  const pages = await getEditablePageOptions(userRoles);
  const selectedPageId = pageId ?? pages[0]?.id;
  const [site, mediaAssets, redirects] = await Promise.all([
    getBrandingSettings(),
    db.mediaAsset.findMany({
      where: { deletedAt: null, mimeType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, filename: true, altText: true, publicUrl: true },
    }),
    db.redirect.findMany({ orderBy: { updatedAt: "desc" }, take: 25 }),
  ]);

  if (!selectedPageId) {
    return {
      pages,
      page: null,
      site,
      mediaAssets,
      redirects,
      score: 0,
      checks: [],
    };
  }

  const page = await db.page.findUniqueOrThrow({
    where: { id: selectedPageId },
    include: {
      template: true,
      seoSetting: { include: { ogImageMedia: true } },
      sections: { where: { deletedAt: null, isVisible: true } },
    },
  });

  const seoSetting =
    page.seoSetting ??
    (await db.seoSetting.create({
      data: {
        pageId: page.id,
        metaTitle: defaultTitle(page.title, site.businessName),
        metaDescription: defaultDescription(site.businessName),
        canonicalUrl: buildCanonicalUrl(site.domain, page.slug),
        twitterCardType: "summary_large_image",
        schemaJson: (await getStructuredDataForPage(
          page.id,
        )) as Prisma.InputJsonValue,
      },
      include: { ogImageMedia: true },
    }));

  const missingAltTextCount = await getMissingAltTextCount();
  const scoreInput = {
    metaTitle: seoSetting.metaTitle,
    metaDescription: seoSetting.metaDescription,
    canonicalUrl: seoSetting.canonicalUrl,
    ogImageUrl: seoSetting.ogImageMedia?.publicUrl,
    robotsIndex: seoSetting.robotsIndex,
    robotsFollow: seoSetting.robotsFollow,
    schemaJson: seoSetting.schemaJson,
    missingAltTextCount,
  };

  return {
    pages,
    page: { ...page, seoSetting },
    site,
    mediaAssets,
    redirects,
    score: getSeoScore(scoreInput),
    checks: getSeoChecks(scoreInput),
  };
}

export async function updateSeoSetting(input: unknown, userId: string) {
  const data = seoSettingSchema.parse(input);
  const existing = await db.seoSetting.findUnique({
    where: { pageId: data.pageId },
  });
  const page = await db.page.findUniqueOrThrow({ where: { id: data.pageId } });
  const site = await db.siteSetting.findFirst({ select: { domain: true } });
  const canonicalUrl = resolveCanonicalUrl({
    canonicalUrl: data.canonicalUrl,
    domain: site?.domain,
    slug: page.slug,
  });

  const seoSetting = await db.seoSetting.upsert({
    where: { pageId: data.pageId },
    update: {
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords || null,
      canonicalUrl,
      ogTitle: data.ogTitle || null,
      ogDescription: data.ogDescription || null,
      ogImageMediaId: data.ogImageMediaId || null,
      twitterCardType: data.twitterCardType,
      robotsIndex: data.robotsIndex,
      robotsFollow: data.robotsFollow,
      schemaJson:
        data.schemaJson === undefined
          ? Prisma.JsonNull
          : (data.schemaJson as Prisma.InputJsonValue),
    },
    create: {
      pageId: data.pageId,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords || null,
      canonicalUrl,
      ogTitle: data.ogTitle || null,
      ogDescription: data.ogDescription || null,
      ogImageMediaId: data.ogImageMediaId || null,
      twitterCardType: data.twitterCardType,
      robotsIndex: data.robotsIndex,
      robotsFollow: data.robotsFollow,
      schemaJson:
        data.schemaJson === undefined
          ? Prisma.JsonNull
          : (data.schemaJson as Prisma.InputJsonValue),
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "seo.update",
      entityType: "seo_setting",
      entityId: seoSetting.id,
      oldValues: existing
        ? {
            metaTitle: existing.metaTitle,
            robotsIndex: existing.robotsIndex,
          }
        : undefined,
      newValues: {
        pageId: seoSetting.pageId,
        metaTitle: seoSetting.metaTitle,
        robotsIndex: seoSetting.robotsIndex,
      },
    },
  });

  return seoSetting;
}

export async function generateStructuredDataForPage(
  pageId: string,
  userId: string,
) {
  const schemaJson = await getStructuredDataForPage(pageId);
  const seoSetting = await db.seoSetting.update({
    where: { pageId },
    data: { schemaJson: schemaJson as Prisma.InputJsonValue },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "seo.schema.generate",
      entityType: "seo_setting",
      entityId: seoSetting.id,
      newValues: { pageId },
    },
  });
}

export async function updateLocalSeo(input: unknown, userId: string) {
  const data = localSeoSchema.parse(input);
  const settings = await getBrandingSettings();
  const updated = await db.siteSetting.update({
    where: { id: settings.id },
    data: {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      postalCode: data.postalCode ?? null,
      latitude: data.latitude === "" ? null : data.latitude,
      longitude: data.longitude === "" ? null : data.longitude,
      openingHours: data.openingHours ?? null,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "seo.local.update",
      entityType: "site_setting",
      entityId: updated.id,
      newValues: {
        city: updated.city,
        region: updated.region,
        country: updated.country,
      },
    },
  });
}

export async function listPublishedSitemapPages() {
  return db.page.findMany({
    where: {
      status: PageStatus.PUBLISHED,
      isDemo: false,
      deletedAt: null,
      seoSetting: { is: { robotsIndex: true } },
    },
    select: {
      slug: true,
      updatedAt: true,
      seoSetting: { select: { canonicalUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getMissingAltTextCount() {
  return db.mediaAsset.count({
    where: {
      deletedAt: null,
      mimeType: { startsWith: "image/" },
      OR: [{ altText: null }, { altText: "" }],
    },
  });
}

function defaultTitle(pageTitle: string, businessName: string) {
  const title = `${pageTitle} | ${businessName}`;
  return title.length >= 30 ? title.slice(0, 60) : `${title} Landing Page`;
}

function defaultDescription(businessName: string) {
  return `${businessName} provides a professional landing page experience with clear services, trust signals and simple ways to get in touch.`;
}
