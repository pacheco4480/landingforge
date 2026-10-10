import { describe, expect, it } from "vitest";

import { auditFiltersSchema } from "@/features/audit/schemas/audit.schema";

describe("audit filters schema", () => {
  it("parses date filters and search values", () => {
    const parsed = auditFiltersSchema.parse({
      action: "page.update",
      from: "2026-06-01",
      search: "admin",
    });

    expect(parsed.action).toBe("page.update");
    expect(parsed.from).toBeInstanceOf(Date);
    expect(parsed.search).toBe("admin");
  });
});
