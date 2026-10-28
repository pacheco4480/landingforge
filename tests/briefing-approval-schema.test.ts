import { describe, expect, it } from "vitest";

import { briefingApprovalTypeSchema } from "@/features/briefings/schemas/briefing-approval.schema";

describe("briefing approval type", () => {
  it("allows only decisions tied to the briefing revision", () => {
    expect(briefingApprovalTypeSchema.parse("SCOPE")).toBe("SCOPE");
    expect(briefingApprovalTypeSchema.parse("CONTENT")).toBe("CONTENT");
    expect(briefingApprovalTypeSchema.safeParse("DESIGN").success).toBe(false);
    expect(briefingApprovalTypeSchema.safeParse("SEO").success).toBe(false);
    expect(briefingApprovalTypeSchema.safeParse("RELEASE").success).toBe(false);
  });
});
