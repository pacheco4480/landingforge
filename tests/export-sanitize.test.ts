import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "@/features/exports/services/csv.service";

describe("csv export helpers", () => {
  it("prefixes formula-like values", () => {
    expect(csvCell("=IMPORTXML('x')")).toBe("\"'=IMPORTXML('x')\"");
  });

  it("builds csv rows", () => {
    expect(toCsv([["Name"], ["LandingForge"]])).toBe(
      "\"Name\"\r\n\"LandingForge\"",
    );
  });
});
