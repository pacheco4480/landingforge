import { describe, expect, it } from "vitest";

import { sectionUpdateSchema } from "@/features/content/schemas/section.schema";

describe("section update patch schema", () => {
  it("accepts an empty content patch so the server can preserve non-editable values", () => {
    expect(sectionUpdateSchema.safeParse({
      id: "950e8400-e29b-41d4-a716-446655440001",
      pageId: "950e8400-e29b-41d4-a716-446655440002",
      name: "Secção",
      sectionType: "clinic_hero",
      content: {},
      settings: {},
    }).success).toBe(true);
  });
});
