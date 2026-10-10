import { describe, expect, it } from "vitest";

import {
  cookieConsentSchema,
  legalSettingsSchema,
} from "@/features/legal/schemas/legal.schema";

describe("legal schemas", () => {
  it("defaults optional cookie categories to necessary only", () => {
    const parsed = cookieConsentSchema.parse({
      consentId: "visitor-consent-1",
      version: "1.0",
    });

    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(false);
    expect(parsed.marketing).toBe(false);
  });

  it("validates legal settings retention and consent version", () => {
    const parsed = legalSettingsSchema.parse({
      consentVersion: "1.1",
      cookieBannerEnabled: "on",
      retentionDays: "365",
    });

    expect(parsed.cookieBannerEnabled).toBe(true);
    expect(parsed.retentionDays).toBe(365);
  });
});
