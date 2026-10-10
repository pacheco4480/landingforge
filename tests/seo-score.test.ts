import { describe, expect, it } from "vitest";

import { getSeoScore } from "@/features/seo/services/seo-score.service";

describe("seo score", () => {
  it("scores complete SEO data higher than incomplete data", () => {
    const complete = getSeoScore({
      metaTitle: "Premium Restaurant Landing Page for Local Reservations",
      metaDescription:
        "Create a high-performing restaurant landing page with local SEO, social previews, structured data and clear reservation conversion paths.",
      canonicalUrl: "https://example.com",
      ogImageUrl: "https://example.com/image.jpg",
      robotsIndex: true,
      robotsFollow: true,
      schemaJson: { "@type": "Restaurant" },
      missingAltTextCount: 0,
    });

    const incomplete = getSeoScore({
      metaTitle: "Short",
      metaDescription: "Short",
      robotsIndex: false,
      robotsFollow: false,
      missingAltTextCount: 2,
    });

    expect(complete).toBeGreaterThan(incomplete);
  });
});
