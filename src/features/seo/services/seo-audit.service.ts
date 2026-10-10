import type { PageStatus } from "@/generated/prisma/client";
import { resolveCanonicalUrl } from "@/features/seo/services/seo-url.service";

export type SeoAuditPage = {
  slug: string;
  status: PageStatus;
  isDemo: boolean;
  seoSetting: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    twitterCardType: string | null;
    robotsIndex: boolean;
    robotsFollow: boolean;
    schemaJson: unknown;
    ogImageMedia?: { publicUrl: string | null } | null;
  } | null;
};

export type SeoAuditIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export function auditSeoPage({
  domain,
  page,
}: {
  domain?: string | null;
  page: SeoAuditPage;
}) {
  const issues: SeoAuditIssue[] = [];
  const seo = page.seoSetting;

  if (page.status !== "PUBLISHED" && seo?.robotsIndex) {
    issues.push({
      severity: "error",
      code: "draft-indexable",
      message: "Draft or archived pages should not be indexable.",
    });
  }

  if (page.isDemo && page.status !== "PUBLISHED" && seo?.robotsIndex) {
    issues.push({
      severity: "error",
      code: "demo-indexable",
      message: "Internal demo pages should not be indexable.",
    });
  }

  if (!seo) {
    issues.push({
      severity: "error",
      code: "missing-seo",
      message: "Page is missing SEO settings.",
    });
    return issues;
  }

  if (!isLengthBetween(seo.metaTitle, 30, 60)) {
    issues.push({
      severity: "warning",
      code: "meta-title-length",
      message: "Meta title should be between 30 and 60 characters.",
    });
  }

  if (!isLengthBetween(seo.metaDescription, 120, 160)) {
    issues.push({
      severity: "warning",
      code: "meta-description-length",
      message: "Meta description should be between 120 and 160 characters.",
    });
  }

  try {
    const canonical = resolveCanonicalUrl({
      canonicalUrl: seo.canonicalUrl,
      domain,
      slug: page.slug,
    });
    if (!/^https?:\/\//.test(canonical)) {
      issues.push({
        severity: "error",
        code: "canonical-invalid",
        message: "Canonical URL must be absolute.",
      });
    }
  } catch {
    issues.push({
      severity: "error",
      code: "canonical-invalid",
      message: "Canonical URL must be absolute.",
    });
  }

  if (!seo.ogImageMedia?.publicUrl) {
    issues.push({
      severity: "warning",
      code: "missing-og-image",
      message: "Open Graph image is recommended for social sharing.",
    });
  }

  if (!seo.schemaJson) {
    issues.push({
      severity: "warning",
      code: "missing-structured-data",
      message: "Structured data is recommended for rich results.",
    });
  }

  return issues;
}

function isLengthBetween(
  value: string | null | undefined,
  min: number,
  max: number,
) {
  const length = value?.trim().length ?? 0;
  return length >= min && length <= max;
}
