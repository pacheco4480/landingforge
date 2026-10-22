import type { MetadataRoute } from "next";

import { resolveCanonicalUrl } from "@/features/seo/services/seo-metadata.service";
import { normalizeSiteBaseUrl } from "@/features/seo/services/seo-url.service";
import { listPublishedSitemapPages } from "@/features/seo/services/seo.service";
import { db } from "@/lib/db";
import { listPublicPortfolioSitemapEntries } from "@/features/portfolio/services/portfolio.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, pages, portfolioEntries] = await Promise.all([
    db.siteSetting.findFirst({ select: { domain: true } }),
    listPublishedSitemapPages(),
    listPublicPortfolioSitemapEntries(),
  ]);

  const siteBase = normalizeSiteBaseUrl(site?.domain);
  return [...pages.map((page) => ({
    url: resolveCanonicalUrl({
      canonicalUrl: page.seoSetting?.canonicalUrl,
      domain: site?.domain,
      slug: page.slug,
    }),
    lastModified: page.updatedAt,
    changeFrequency: "weekly" as const,
    priority: page.slug === "home" ? 1 : 0.8,
  })), ...portfolioEntries.map((entry) => ({
    url: `${siteBase}${entry.path}`,
    lastModified: entry.updatedAt,
    changeFrequency: "monthly" as const,
    priority: entry.priority,
  }))];
}
