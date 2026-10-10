import { describe, expect, it } from "vitest";

import { evaluateConditionalRule } from "@/features/forms/services/conditional-logic.service";

describe("conditional logic", () => {
  it("evaluates equals and empty conditions", () => {
    expect(
      evaluateConditionalRule(
        { field: "type", operator: "equals", value: "house", action: "show" },
        { type: "house" },
      ),
    ).toBe(true);
    expect(
      evaluateConditionalRule(
        { field: "phone", operator: "empty", action: "require" },
        { phone: "" },
      ),
    ).toBe(true);
  });
});
