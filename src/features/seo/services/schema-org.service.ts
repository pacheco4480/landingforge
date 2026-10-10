import type {
  Page,
  PageSection,
  SiteSetting,
  Template,
} from "@/generated/prisma/client";

export function buildStructuredData({
  page,
  site,
}: {
  page: Page & { template: Template | null; sections: PageSection[] };
  site: SiteSetting;
}) {
  const base = {
    "@context": "https://schema.org",
    "@type": resolveBusinessType(page.template?.key, site.businessType),
    name: site.businessName,
    url: buildSiteUrl(site.domain, page.slug),
    email: site.contactEmail,
    telephone: site.contactPhone ?? undefined,
    address: buildAddress(site),
    geo: buildGeo(site),
    openingHours: buildOpeningHours(site.openingHours),
    sameAs: buildSameAs(site),
  };

  const faq = buildFaqSchema(page.sections);
  return faq ? [base, faq] : base;
}

function resolveBusinessType(templateKey?: string, businessType?: string) {
  if (templateKey === "clinic") return "MedicalBusiness";
  if (templateKey === "restaurant" || templateKey === "bakery")
    return "Restaurant";
  if (templateKey === "real_estate" || templateKey === "construction") {
    return "ProfessionalService";
  }
  if (businessType?.includes("organization")) return "Organization";
  return "LocalBusiness";
}

function buildAddress(
  site: SiteSetting & {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    postalCode?: string | null;
  },
) {
  if (!site.address && !site.city && !site.region && !site.country)
    return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: site.address ?? undefined,
    addressLocality: site.city ?? undefined,
    addressRegion: site.region ?? undefined,
    postalCode: site.postalCode ?? undefined,
    addressCountry: site.country ?? undefined,
  };
}

function buildGeo(site: SiteSetting) {
  if (site.latitude === null || site.longitude === null) return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude: site.latitude,
    longitude: site.longitude,
  };
}

function buildOpeningHours(openingHours: string | null) {
  if (!openingHours?.trim()) return undefined;
  return openingHours
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSameAs(site: SiteSetting) {
  const links = [
    site.facebookUrl,
    site.instagramUrl,
    site.linkedinUrl,
    site.whatsappUrl,
  ].filter((url): url is string => Boolean(url));
  return links.length > 0 ? links : undefined;
}

function buildFaqSchema(sections: PageSection[]) {
  const faqSection = sections.find((section) => section.sectionType === "faq");
  const content = faqSection?.content;
  if (!content || typeof content !== "object" || Array.isArray(content))
    return null;
  const items = "items" in content ? content.items : undefined;
  if (!Array.isArray(items) || items.length === 0) return null;

  const mainEntity = items
    .filter((item) => isFaqItem(item))
    .map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }));

  if (mainEntity.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

function isFaqItem(
  item: unknown,
): item is { question: string; answer: string } {
  return (
    item !== null &&
    typeof item === "object" &&
    "question" in item &&
    "answer" in item &&
    typeof item.question === "string" &&
    typeof item.answer === "string"
  );
}

function buildSiteUrl(domain: string | null, slug: string) {
  const base =
    domain || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return slug === "home" ? normalizedBase : `${normalizedBase}/${slug}`;
}
