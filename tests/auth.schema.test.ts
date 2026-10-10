import { describe, expect, it } from "vitest";

import {
  loginSchema,
  passwordSchema,
} from "@/features/auth/schemas/auth.schema";

describe("authentication schemas", () => {
  it("accepts the documented password policy", () => {
    expect(passwordSchema.safeParse("secure123").success).toBe(true);
  });

  it("rejects passwords without a number", () => {
    expect(passwordSchema.safeParse("securepassword").success).toBe(false);
  });

  it("normalizes login email addresses", () => {
    const result = loginSchema.parse({
      email: "  USER@EXAMPLE.COM ",
      password: "secure123",
    });
    expect(result.email).toBe("user@example.com");
  });
});
