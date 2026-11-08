import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Real Estate hover-motion contract", () => {
  it("marks property images for the shared reduced-motion policy", () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        "src/features/public-renderer/templates/real-estate/estate-editorial.module.css",
      ),
      "utf8",
    );

    expect(css).toContain(
      '.propertyImage:hover img[data-public-motion="hover-zoom"]',
    );
  });
});
