import { describe, expect, it } from "vitest";

import { FormStatus, FormType } from "@/generated/prisma/client";
import { formSchema } from "@/features/forms/schemas/form.schema";
import { formFieldSchema } from "@/features/forms/schemas/form-field.schema";

describe("forms schemas", () => {
  it("accepts a valid form", () => {
    const form = formSchema.parse({
      name: "Contact Form",
      key: "contact",
      type: FormType.CONTACT,
      status: FormStatus.PUBLISHED,
      successMessage: "Thank you.",
      errorMessage: "Try again.",
      recipientEmail: "hello@example.com",
    });

    expect(form.key).toBe("contact");
  });

  it("rejects invalid field names", () => {
    expect(() =>
      formFieldSchema.parse({
        formId: "550e8400-e29b-41d4-a716-446655440000",
        label: "Bad",
        name: "Bad Name",
        type: "TEXT",
        isRequired: true,
        isVisible: true,
      }),
    ).toThrow();
  });
});
