import { describe, expect, it } from "vitest";

import { brandingSchema } from "@/features/branding/schemas/branding.schema";
import { themeSchema } from "@/features/branding/schemas/theme.schema";

describe("branding schemas", () => {
  it("accepts valid branding settings", () => {
    const result = brandingSchema.parse({
      businessName: "LandingForge",
      siteName: "LandingForge",
      businessType: "landing_page",
      contactEmail: "hello@example.com",
      primaryColor: "#14532d",
      secondaryColor: "#0f766e",
      accentColor: "#f59e0b",
    });

    expect(result.businessName).toBe("LandingForge");
  });

  it("rejects invalid theme colors", () => {
    expect(() =>
      themeSchema.parse({
        name: "Invalid",
        key: "invalid",
        primaryColor: "green",
        secondaryColor: "#000000",
        accentColor: "#000000",
        backgroundColor: "#ffffff",
        surfaceColor: "#ffffff",
        textPrimaryColor: "#111827",
        textSecondaryColor: "#475569",
        headingFont: "Arial",
        bodyFont: "Arial",
        borderRadius: "medium",
        shadowStyle: "small",
      }),
    ).toThrow();
  });
});
