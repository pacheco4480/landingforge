import { afterAll, describe, expect, it } from "vitest";

import { authenticateUser } from "@/features/auth/services/auth.service";
import { db } from "@/lib/db";

describe("credentials authentication integration", () => {
  it.each([
    ["admin@landingforge.local", "super_admin"],
    ["client@landingforge.local", "client_admin"],
    ["viewer@landingforge.local", "viewer"],
  ])(
    "authenticates %s with the expected role",
    async (email, role) => {
      const user = await authenticateUser(email, "LandingForge123!");
      expect(user?.roles).toContain(role);
      expect(user?.permissions.length).toBeGreaterThan(0);
    },
    15000,
  );

  it("rejects invalid credentials", async () => {
    await expect(
      authenticateUser("admin@landingforge.local", "incorrect-password"),
    ).resolves.toBeNull();
  });

  afterAll(async () => {
    await db.$disconnect();
  });
});
