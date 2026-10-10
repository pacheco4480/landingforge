import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "@/features/auth/services/password.service";

describe("password service", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secure123");
    expect(hash).not.toContain("secure123");
    await expect(verifyPassword(hash, "secure123")).resolves.toBe(true);
    await expect(verifyPassword(hash, "incorrect123")).resolves.toBe(false);
  }, 15000);
});
