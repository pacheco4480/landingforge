import { describe, expect, it } from "vitest";

import { PageStatus, PageType } from "@/generated/prisma/client";
import { buildStructuredData } from "@/features/seo/services/schema-org.service";

describe("schema.org service", () => {
  it("generates local business structured data", () => {
    const schema = buildStructuredData({
      site: {
        id: "site",
        siteName: "Demo",
        businessName: "Demo Clinic",
        businessType: "clinic",
        domain: "https://example.com",
        defaultLanguage: "pt-PT",
        timezone: "Europe/Lisbon",
        contactEmail: "hello@example.com",
        contactPhone: null,
        address: "Main Street",
        city: "Lisbon",
        region: "Lisbon",
        country: "PT",
        postalCode: "1000",
        latitude: 38.7223,
        longitude: -9.1393,
        openingHours: "Mo-Fr 09:00-18:00",
        whatsappUrl: null,
        facebookUrl: "https://facebook.com/demo",
        instagramUrl: null,
        linkedinUrl: null,
        primaryColor: "#111111",
        secondaryColor: "#222222",
        accentColor: "#333333",
        logoMediaId: null,
        faviconMediaId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      page: {
        id: "page",
        title: "Clinic",
        slug: "clinic",
        status: PageStatus.PUBLISHED,
        pageType: PageType.LANDING,
        isDemo: false,
        demoKey: null,
        demoStatus: null,
        portfolioVisible: false,
        portfolioOrder: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        templateId: null,
        templateVariantId: null,
        themeId: null,
        template: null,
        sections: [],
      },
    });

    expect(JSON.stringify(schema)).toContain("Demo Clinic");
    expect(JSON.stringify(schema)).toContain("GeoCoordinates");
    expect(JSON.stringify(schema)).toContain("https://facebook.com/demo");
  });
});
