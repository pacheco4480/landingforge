import { afterEach, describe, expect, it } from "vitest";

import { buildDeliveryChecklist } from "@/features/deployment/services/deployment.service";

describe("buildDeliveryChecklist", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalCronSecret = process.env.CRON_SECRET;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalAuthUrl = process.env.AUTH_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.CRON_SECRET = originalCronSecret;
    process.env.AUTH_SECRET = originalAuthSecret;
    process.env.AUTH_URL = originalAuthUrl;
  });

  it("marks a ready client deployment when all required items are complete", () => {
    process.env.DATABASE_URL = "postgresql://test";
    process.env.NEXT_PUBLIC_SITE_URL = "https://cliente.pt";
    process.env.CRON_SECRET = "secret";
    process.env.AUTH_SECRET = "secret";
    process.env.AUTH_URL = "https://cliente.pt";

    const checklist = buildDeliveryChecklist({
      cmsEnabled: true,
      domain: "cliente.pt",
      domainConnected: true,
      sslActive: true,
      hasPublishedPage: true,
      hasSeoSettings: true,
      hasBranding: true,
    });

    expect(checklist.every((item) => item.complete)).toBe(true);
  });

  it("keeps domain incomplete when DNS is not connected", () => {
    const checklist = buildDeliveryChecklist({
      cmsEnabled: false,
      domain: "cliente.pt",
      domainConnected: false,
      sslActive: true,
      hasPublishedPage: true,
      hasSeoSettings: true,
      hasBranding: true,
    });

    const domain = checklist.find((item) => item.key === "domain");

    expect(domain?.complete).toBe(false);
  });
});
