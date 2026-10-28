import { describe, expect, it } from "vitest";

import { parseProjectFilters } from "@/features/projects/schemas/project-filter.schema";

describe("project workspace filters", () => {
  it("normalizes empty query fields and reads one value from query arrays", () => {
    const result = parseProjectFilters({
      q: [" Clínica Aurora ", "ignored"],
      industry: "",
      status: "REVIEW",
      from: "2026-10-01",
      to: "2026-10-24",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        q: "Clínica Aurora",
        status: "REVIEW",
        from: "2026-10-01",
        to: "2026-10-24",
      });
      expect(result.data.industry).toBeUndefined();
    }
  });

  it("rejects invalid statuses, malformed dates and reversed date ranges", () => {
    expect(parseProjectFilters({ status: "NOT_A_STATUS" }).success).toBe(false);
    expect(parseProjectFilters({ from: "2026-13-40" }).success).toBe(false);
    expect(parseProjectFilters({ from: "2026-10-20", to: "2026-10-01" }).success).toBe(false);
  });

  it("caps free-text search input", () => {
    expect(parseProjectFilters({ q: "x".repeat(101) }).success).toBe(false);
  });
});
