import { describe, expect, it } from "vitest";

import { sectionCreateSchema } from "@/features/content/schemas/section.schema";
import { pageCreateSchema } from "@/features/content/schemas/page.schema";

describe("content schemas", () => {
  it("accepts a valid page payload", () => {
    const page = pageCreateSchema.parse({
      title: "Main Campaign",
      slug: "main-campaign",
      status: "DRAFT",
      pageType: "LANDING",
      templateId: "",
      templateVariantId: "",
    });

    expect(page.slug).toBe("main-campaign");
  });

  it("rejects unsafe slugs", () => {
    expect(() =>
      pageCreateSchema.parse({
        title: "Bad Slug",
        slug: "../admin",
        status: "DRAFT",
        pageType: "LANDING",
      }),
    ).toThrow();
  });

  it("accepts only supported section types", () => {
    expect(
      sectionCreateSchema.parse({
        pageId: "00000000-0000-0000-0000-000000000000",
        name: "Hero",
        sectionType: "hero",
      }).sectionType,
    ).toBe("hero");
  });
});
