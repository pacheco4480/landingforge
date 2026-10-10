import { describe, expect, it } from "vitest";

import { seoSettingSchema } from "@/features/seo/schemas/seo.schema";

describe("seo schema", () => {
  it("accepts complete SEO settings", () => {
    const result = seoSettingSchema.parse({
      pageId: "550e8400-e29b-41d4-a716-446655440000",
      metaTitle: "Premium Clinic Landing Page for Local Leads",
      metaDescription:
        "Create a fast, accessible and conversion-focused clinic landing page with clear services, local SEO and simple patient contact workflows.",
      canonicalUrl: "https://example.com/clinic",
      twitterCardType: "summary_large_image",
      robotsIndex: true,
      robotsFollow: true,
      schemaJson: '{"@context":"https://schema.org","@type":"LocalBusiness"}',
    });

    expect(result.schemaJson).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
    });
  });

  it("rejects short metadata", () => {
    expect(() =>
      seoSettingSchema.parse({
        pageId: "550e8400-e29b-41d4-a716-446655440000",
        metaTitle: "Short",
        metaDescription: "Too short",
        robotsIndex: true,
        robotsFollow: true,
      }),
    ).toThrow();
  });
});
