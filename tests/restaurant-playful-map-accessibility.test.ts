import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const template = readFileSync(
  "src/features/public-renderer/templates/restaurant/restaurant-playful.tsx",
  "utf8",
);

describe("Restaurant Playful map link accessibility", () => {
  it("uses visible link content as the accessible name", () => {
    const mapLinkOpening = template.match(
      /<a\n(?:(?!\n          >)[\s\S])*restaurant-playful-location__map-note[\s\S]*?\n          >/,
    );

    expect(mapLinkOpening).not.toBeNull();
    expect(mapLinkOpening?.[0]).not.toContain("aria-label");
  });
});
