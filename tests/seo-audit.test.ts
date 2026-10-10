import { describe, expect, it } from "vitest";

import { PageStatus } from "@/generated/prisma/client";
import { auditSeoPage } from "@/features/seo/services/seo-audit.service";

const validSeoSetting = {
  metaTitle: "LandingForge SEO Technical Review Page",
  metaDescription:
    "LandingForge technical SEO review validates metadata, canonical URLs, Open Graph data, structured data and indexing rules.",
  canonicalUrl: "https://example.com/seo-review",
  ogTitle: "LandingForge SEO Technical Review",
  ogDescription: "Technical SEO review for LandingForge landing pages.",
  twitterCardType: "summary_large_image",
  robotsIndex: true,
  robotsFollow: true,
  schemaJson: { "@type": "WebPage" },
  ogImageMedia: { publicUrl: "https://example.com/og.jpg" },
};

describe("seo audit service", () => {
  it("accepts a complete published landing page", () => {
    const issues = auditSeoPage({
      domain: "example.com",
      page: {
        slug: "seo-review",
        status: PageStatus.PUBLISHED,
        isDemo: false,
        seoSetting: validSeoSetting,
      },
    });

    expect(issues).toEqual([]);
  });

  it("flags draft and demo pages that are indexable", () => {
    const issues = auditSeoPage({
      domain: "example.com",
      page: {
        slug: "draft",
        status: PageStatus.DRAFT,
        isDemo: true,
        seoSetting: validSeoSetting,
      },
    });

    expect(issues.map((issue) => issue.code)).toEqual([
      "draft-indexable",
      "demo-indexable",
    ]);
  });

  it("allows published public demo pages to be indexable", () => {
    const issues = auditSeoPage({
      domain: "example.com",
      page: {
        slug: "universal-demo",
        status: PageStatus.PUBLISHED,
        isDemo: true,
        seoSetting: validSeoSetting,
      },
    });

    expect(issues).toEqual([]);
  });

  it("flags missing SEO settings", () => {
    const issues = auditSeoPage({
      domain: "example.com",
      page: {
        slug: "missing",
        status: PageStatus.PUBLISHED,
        isDemo: false,
        seoSetting: null,
      },
    });

    expect(issues).toEqual([
      {
        severity: "error",
        code: "missing-seo",
        message: "Page is missing SEO settings.",
      },
    ]);
  });
});
