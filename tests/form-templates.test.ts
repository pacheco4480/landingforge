import { describe, expect, it } from "vitest";

import { formTemplates } from "@/features/forms/services/form-template.service";

describe("form templates", () => {
  it("provides required base templates", () => {
    expect(formTemplates.contact.fields.length).toBeGreaterThan(0);
    expect(formTemplates.quote.key).toBe("quote-request");
    expect(
      formTemplates.appointment.fields.some(([name]) => name === "date"),
    ).toBe(true);
    expect(formTemplates.newsletter.fields).toHaveLength(1);
  });
});
