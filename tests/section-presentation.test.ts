import { describe, expect, it } from "vitest";

import {
  defaultPresentation,
  normalizePresentationSettings,
  presentationOptions,
  resolvePresentation,
} from "@/features/public-renderer/section-presentation";

describe("public section presentation presets", () => {
  it("uses distinct FAQ defaults for supported template variants", () => {
    expect(defaultPresentation("faq", "clinic", "modern")).toBe("accordion");
    expect(defaultPresentation("faq", "clinic", "luxury")).toBe("editorial");
    expect(defaultPresentation("faq", "restaurant", "playful")).toBe("grouped");
  });

  it("limits CMS choices to the current template compatibility list", () => {
    expect(
      presentationOptions("faq", "clinic", "modern").map(({ value }) => value),
    ).toEqual(["accordion", "grouped"]);
    expect(
      presentationOptions("contact", "restaurant", "playful").map(
        ({ value }) => value,
      ),
    ).toEqual(["compact", "standard"]);
  });

  it("falls back safely for invalid or incompatible saved settings", () => {
    expect(
      resolvePresentation(
        "faq",
        { presentationVariant: "compact" },
        "clinic",
        "modern",
      ),
    ).toBe("accordion");
    expect(
      resolvePresentation(
        "contact",
        { presentationVariant: "unknown" },
        "clinic",
        "luxury",
      ),
    ).toBe("editorial");
    expect(resolvePresentation("faq", {}, "unregistered", "variant")).toBe(
      "grouped",
    );
  });

  it("normalizes CMS settings without accepting arbitrary variants", () => {
    expect(
      normalizePresentationSettings(
        { density: "comfortable", presentationVariant: "bogus" },
        "faq",
        "editorial",
        "clinic",
        "modern",
      ),
    ).toEqual({ density: "comfortable" });
    expect(
      normalizePresentationSettings(
        { density: "comfortable" },
        "faq",
        "grouped",
        "clinic",
        "modern",
      ),
    ).toEqual({ density: "comfortable", presentationVariant: "grouped" });
  });
});
