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
      message: "As páginas em rascunho ou arquivadas não devem ser indexáveis.",
    });
  }

  if (page.isDemo && page.status !== "PUBLISHED" && seo?.robotsIndex) {
    issues.push({
      severity: "error",
      code: "demo-indexable",
      message: "As páginas de demonstração internas não devem ser indexáveis.",
    });
  }

  if (!seo) {
    issues.push({
      severity: "error",
      code: "missing-seo",
      message: "Faltam definições de SEO nesta página.",
    });
    return issues;
  }

  if (!isLengthBetween(seo.metaTitle, 30, 60)) {
    issues.push({
      severity: "warning",
      code: "meta-title-length",
      message: "O título SEO deve ter entre 30 e 60 caracteres.",
    });
  }

  if (!isLengthBetween(seo.metaDescription, 120, 160)) {
    issues.push({
      severity: "warning",
      code: "meta-description-length",
      message: "A descrição SEO deve ter entre 120 e 160 caracteres.",
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
        message: "O URL canónico tem de ser absoluto.",
      });
    }
  } catch {
    issues.push({
      severity: "error",
      code: "canonical-invalid",
        message: "O URL canónico tem de ser absoluto.",
    });
  }

  if (!seo.ogImageMedia?.publicUrl) {
    issues.push({
      severity: "warning",
      code: "missing-og-image",
      message: "Recomenda-se uma imagem Open Graph para partilha nas redes sociais.",
    });
  }

  if (!seo.schemaJson) {
    issues.push({
      severity: "warning",
      code: "missing-structured-data",
      message: "Recomenda-se dados estruturados para resultados de pesquisa enriquecidos.",
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
