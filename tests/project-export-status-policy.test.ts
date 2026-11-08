import { describe, expect, it } from "vitest";

import { isProjectExportStatusEligible } from "@/features/exports/services/project-export-status-policy";

describe("project export status policy", () => {
  it.each(["APPROVED", "DELIVERED"])("allows %s projects", (status) => {
    expect(isProjectExportStatusEligible(status)).toBe(true);
  });

  it.each(["BRIEFING", "CONTENT_COLLECTION", "PLANNING", "DEVELOPMENT", "REVIEW", "MAINTENANCE", "ARCHIVED"])(
    "blocks %s projects",
    (status) => {
      expect(isProjectExportStatusEligible(status)).toBe(false);
    },
  );
});
