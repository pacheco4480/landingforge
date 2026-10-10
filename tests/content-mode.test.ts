import { afterEach, describe, expect, it } from "vitest";

import { getContentMode } from "@/features/content/content-mode";

describe("getContentMode", () => {
  const originalValue = process.env.INTERNAL_DEMO_MODE;

  afterEach(() => {
    process.env.INTERNAL_DEMO_MODE = originalValue;
  });

  it("enables demo mode only for super admin when configured", () => {
    process.env.INTERNAL_DEMO_MODE = "true";

    expect(getContentMode(["super_admin"]).canUseDemoMode).toBe(true);
    expect(getContentMode(["client_admin"]).canUseDemoMode).toBe(false);
    expect(getContentMode(["viewer"]).canUseDemoMode).toBe(false);
  });

  it("uses client pages when internal demo mode is disabled", () => {
    process.env.INTERNAL_DEMO_MODE = "false";

    expect(getContentMode(["super_admin"]).pageFilter).toEqual({
      isDemo: false,
    });
  });
});
