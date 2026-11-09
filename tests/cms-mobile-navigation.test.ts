import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/features/cms/components/cms-mobile-navigation.tsx",
  "utf8",
);

describe("CMS mobile disclosure keyboard behavior", () => {
  it("closes on Escape and restores focus to the disclosure control", () => {
    expect(source).toContain('event.key !== "Escape"');
    expect(source).toContain("disclosureRef.current.open = false");
    expect(source).toContain("summaryRef.current?.focus()");
    expect(source).toContain("focus-visible:outline");
  });
});
