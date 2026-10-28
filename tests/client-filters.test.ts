import { describe, expect, it } from "vitest";

import { parseClientFilters } from "@/features/clients/schemas/client-filter.schema";

describe("client workspace filters", () => {
  it("normalizes empty fields and reads the first repeated query value", () => {
    const result = parseClientFilters({
      q: ["  Clínica Aurora  ", "ignored"],
      industry: "",
      status: "REVIEW",
      from: "2026-10-01",
      to: "2026-10-24",
      page: "3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        q: "Clínica Aurora",
        status: "REVIEW",
        from: "2026-10-01",
        to: "2026-10-24",
        page: 3,
      });
      expect(result.data.industry).toBeUndefined();
    }
  });

  it("rejects invalid statuses, dates, ranges and page values", () => {
    expect(parseClientFilters({ status: "NOT_A_STATUS" }).success).toBe(false);
    expect(parseClientFilters({ from: "2026-13-40" }).success).toBe(false);
    expect(
      parseClientFilters({ from: "2026-10-20", to: "2026-10-01" }).success,
    ).toBe(false);
    expect(parseClientFilters({ page: "0" }).success).toBe(false);
  });

  it("caps free-text filters", () => {
    expect(parseClientFilters({ q: "x".repeat(101) }).success).toBe(false);
    expect(parseClientFilters({ industry: "x".repeat(81) }).success).toBe(
      false,
    );
  });
});
