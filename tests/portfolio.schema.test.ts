import { describe, expect, it } from "vitest";

import { DemoStatus, PageStatus } from "@/generated/prisma/client";
import { canPublishPortfolioScreenshot, publicPortfolioWhere } from "@/features/portfolio/policies/public-portfolio.policy";
import {
  portfolioFilterSchema,
  portfolioScreenshotSchema,
  portfolioVisibilitySchema,
} from "@/features/portfolio/schemas/portfolio.schema";

describe("portfolio schemas and publication policy", () => {
  it("normalizes a search term and ignores malformed filter identifiers", () => {
    expect(portfolioFilterSchema.parse({ q: "  Clinic  ", template: "invalid" })).toEqual({
      q: "Clinic",
      industry: undefined,
      template: undefined,
      variant: undefined,
    });
  });

  it("accepts bounded portfolio ordering and rejects invalid visibility input", () => {
    expect(portfolioVisibilitySchema.parse({
      pageId: "550e8400-e29b-41d4-a716-446655440000",
      isPublic: true,
      sortOrder: 0,
    }).sortOrder).toBe(0);
    expect(() => portfolioVisibilitySchema.parse({
      pageId: "550e8400-e29b-41d4-a716-446655440000",
      isPublic: "true",
      sortOrder: -1,
    })).toThrow();
  });

  it("validates screenshot metadata and requires explicit boolean visibility", () => {
    const screenshot = portfolioScreenshotSchema.parse({
      pageId: "550e8400-e29b-41d4-a716-446655440000",
      category: "section",
      viewport: "desktop",
      sourceRoute: "/clinic-modern-demo#services",
      consentState: "accepted",
      contentOrigin: "fictional-demo",
      altText: "Secção de serviços da demo clínica",
    });
    expect(screenshot.isPublic).toBe(false);
    expect(() => portfolioScreenshotSchema.parse({
      pageId: "550e8400-e29b-41d4-a716-446655440000",
      category: "dashboard",
      viewport: "desktop",
      sourceRoute: "/clinic-modern-demo",
      consentState: "accepted",
      contentOrigin: "fictional-demo",
      altText: "Captura interna",
      isPublic: "false",
    })).toThrow();
  });

  it("only lists published, approved demos with active template relationships", () => {
    expect(publicPortfolioWhere).toMatchObject({
      isDemo: true,
      status: PageStatus.PUBLISHED,
      demoStatus: DemoStatus.PUBLISHED,
      portfolioVisible: true,
      deletedAt: null,
      template: { is: { isActive: true, industry: { is: { isActive: true } } } },
      templateVariant: { is: { isActive: true } },
    });
  });

  it("never publishes internal or consent-rejected screenshots", () => {
    const approved = {
      consentState: "accepted",
      hasPublicAsset: true,
      portfolioVisible: true,
      pageStatus: "PUBLISHED",
      demoStatus: "PUBLISHED",
    };
    expect(canPublishPortfolioScreenshot({ ...approved, category: "hero" })).toBe(true);
    expect(canPublishPortfolioScreenshot({ ...approved, category: "cms" })).toBe(false);
    expect(canPublishPortfolioScreenshot({ ...approved, category: "dashboard" })).toBe(false);
    expect(canPublishPortfolioScreenshot({ ...approved, category: "section", consentState: "rejected" })).toBe(false);
  });
});
