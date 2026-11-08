import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CookieConsentBanner } from "@/features/legal/components/cookie-consent-banner";

describe("cookie consent accessibility semantics", () => {
  it("exposes the consent panel as a labelled non-modal dialog", () => {
    const markup = renderToStaticMarkup(
      createElement(CookieConsentBanner, {
        saveConsentAction: async () => undefined,
        analyticsEnabled: false,
        cookiePolicyHref: "/politica-cookies",
        enabled: true,
        marketingEnabled: false,
        version: "test",
      }),
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-labelledby="cookie-consent-title"');
    expect(markup).not.toContain("aria-modal");
  });

  it("does not move keyboard focus into the non-modal panel on mount", () => {
    const source = readFileSync(
      new URL("../src/features/legal/components/cookie-consent-banner.tsx", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain(".focus()");
  });

  it("keeps the mobile prompt compact without removing consent choices", () => {
    const markup = renderToStaticMarkup(
      createElement(CookieConsentBanner, {
        saveConsentAction: async () => undefined,
        analyticsEnabled: true,
        cookiePolicyHref: "/politica-cookies",
        enabled: true,
        marketingEnabled: true,
        version: "test",
      }),
    );

    expect(markup).toContain("max-h-[calc(100dvh-1rem)]");
    expect(markup).toContain("grid-cols-3");
    expect(markup).toContain("sr-only sm:not-sr-only");
    expect(markup).toContain("Necessários ativos; opcionais só com consentimento.");
    expect(markup).toContain('aria-label="Política de Cookies"');
    expect(markup).toContain('href="/politica-cookies"');
    expect(markup).toContain("Recusar");
    expect(markup).toContain("Personalizar");
    expect(markup).toContain("Aceitar");
  });
});
