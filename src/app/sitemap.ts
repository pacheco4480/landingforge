import type { MetadataRoute } from "next";

import { resolveCanonicalUrl } from "@/features/seo/services/seo-metadata.service";
import { listPublishedSitemapPages } from "@/features/seo/services/seo.service";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, pages] = await Promise.all([
    db.siteSetting.findFirst({ select: { domain: true } }),
    listPublishedSitemapPages(),
  ]);

  return pages.map((page) => ({
    url: resolveCanonicalUrl({
      canonicalUrl: page.seoSetting?.canonicalUrl,
      domain: site?.domain,
      slug: page.slug,
    }),
    lastModified: page.updatedAt,
    changeFrequency: "weekly",
    priority: page.slug === "home" ? 1 : 0.8,
  }));
}
