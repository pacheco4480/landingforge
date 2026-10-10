import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import {
  getPublishedPageBySlug,
  getPublishedPageMetadataBySlug,
} from "@/features/public-renderer/services/public-page.service";
import { publicPageCacheTag } from "@/features/public-renderer/services/public-cache.service";
import { buildStructuredData } from "@/features/seo/services/schema-org.service";
import {
  buildCanonicalUrl,
  resolveCanonicalUrl,
} from "@/features/seo/services/seo-url.service";
import { db } from "@/lib/db";

export const publicPageCacheRevalidateSeconds = 300;

export const getCachedPublishedPageBySlug = unstable_cache(
  async (slug: string) => getPublishedPageBySlug(slug),
  ["published-page-by-slug"],
  { revalidate: publicPageCacheRevalidateSeconds, tags: [publicPageCacheTag] },
);

const getCachedPublishedPageMetadataBySlug = unstable_cache(
  async (slug: string) => getPublishedPageMetadataBySlug(slug),
  ["published-page-metadata-by-slug"],
  { revalidate: publicPageCacheRevalidateSeconds, tags: [publicPageCacheTag] },
);

export async function generatePageMetadataBySlug(
  slug: string,
): Promise<Metadata> {
  const result = await getCachedPublishedPageMetadataBySlug(slug);

  if (!result) {
    return { robots: { index: false, follow: false } };
  }

  const { site, page } = result;
  const title = page.seoSetting?.metaTitle ?? page.title;
  const description =
    page.seoSetting?.metaDescription ??
    site?.businessName ??
    "Premium landing page.";
  const canonical =
    resolveCanonicalUrl({
      canonicalUrl: page.seoSetting?.canonicalUrl,
      domain: site?.domain,
      slug: page.slug,
    });
  const imageUrl =
    page.seoSetting?.ogImageMedia?.publicUrl ??
    site?.logoMedia?.publicUrl ??
    undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: page.seoSetting?.robotsIndex ?? true,
      follow: page.seoSetting?.robotsFollow ?? true,
    },
    openGraph: {
      title: page.seoSetting?.ogTitle ?? title,
      description: page.seoSetting?.ogDescription ?? description,
      url: canonical,
      siteName: site?.siteName ?? "LandingForge",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: "website",
    },
    twitter: {
      card:
        page.seoSetting?.twitterCardType === "summary"
          ? "summary"
          : "summary_large_image",
      title: page.seoSetting?.ogTitle ?? title,
      description: page.seoSetting?.ogDescription ?? description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export async function getStructuredDataForPage(pageId: string) {
  const [site, page] = await Promise.all([
    db.siteSetting.findFirstOrThrow(),
    db.page.findUniqueOrThrow({
      where: { id: pageId },
      include: {
        template: true,
        sections: { where: { deletedAt: null, isVisible: true } },
        seoSetting: true,
      },
    }),
  ]);

  return page.seoSetting?.schemaJson ?? buildStructuredData({ page, site });
}

export { buildCanonicalUrl, resolveCanonicalUrl };
