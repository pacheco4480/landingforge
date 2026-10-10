import type { MetadataRoute } from "next";

import { normalizeSiteBaseUrl } from "@/features/seo/services/seo-url.service";
import { db } from "@/lib/db";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await db.siteSetting.findFirst({ select: { domain: true } });
  const normalizedBase = normalizeSiteBaseUrl(site?.domain);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/analytics",
        "/branding",
        "/content",
        "/forms",
        "/leads",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/pages",
        "/media",
        "/seo",
        "/settings",
        "/admin",
        "/api",
      ],
    },
    sitemap: `${normalizedBase}/sitemap.xml`,
  };
}
