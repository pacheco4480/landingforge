import { describe, expect, it } from "vitest";

import {
  buildCanonicalUrl,
  publicPageCacheRevalidateSeconds,
} from "@/features/seo/services/seo-metadata.service";

describe("public performance helpers", () => {
  it("keeps public page cache aligned with the landing ISR window", () => {
    expect(publicPageCacheRevalidateSeconds).toBe(300);
  });

  it("normalizes canonical URLs without duplicate slashes", () => {
    expect(buildCanonicalUrl("https://example.com/", "contacto")).toBe(
      "https://example.com/contacto",
    );
    expect(buildCanonicalUrl("https://example.com/", "home")).toBe(
      "https://example.com",
    );
  });
});
