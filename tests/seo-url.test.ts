import { describe, expect, it } from "vitest";

import {
  buildCanonicalUrl,
  normalizePath,
  normalizeSiteBaseUrl,
  resolveCanonicalUrl,
} from "@/features/seo/services/seo-url.service";

describe("seo url service", () => {
  it("normalizes site domains with and without protocol", () => {
    expect(normalizeSiteBaseUrl("example.com")).toBe("https://example.com");
    expect(normalizeSiteBaseUrl("https://example.com/landing")).toBe(
      "https://example.com",
    );
  });

  it("builds canonical URLs for home and slugs", () => {
    expect(buildCanonicalUrl("example.com", "home")).toBe("https://example.com");
    expect(buildCanonicalUrl("example.com", "contacto")).toBe(
      "https://example.com/contacto",
    );
  });

  it("resolves relative canonical paths to absolute URLs", () => {
    expect(
      resolveCanonicalUrl({
        canonicalUrl: "/servicos/",
        domain: "cliente.pt",
        slug: "fallback",
      }),
    ).toBe("https://cliente.pt/servicos");
  });

  it("preserves absolute canonical paths", () => {
    expect(
      resolveCanonicalUrl({
        canonicalUrl: "https://cliente.pt/servicos?utm=1#top",
        domain: "fallback.pt",
        slug: "fallback",
      }),
    ).toBe("https://cliente.pt/servicos?utm=1");
  });

  it("normalizes paths", () => {
    expect(normalizePath("servicos/")).toBe("/servicos");
    expect(normalizePath("/servicos?x=1")).toBe("/servicos");
  });
});
