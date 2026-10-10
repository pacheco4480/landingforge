import { describe, expect, it } from "vitest";

import { hasPermission, hasRole } from "@/features/rbac/rbac.service";

describe("RBAC service", () => {
  it("checks permissions without partial matches", () => {
    expect(hasPermission(["pages.read"], "pages.read")).toBe(true);
    expect(hasPermission(["pages.read"], "pages.write")).toBe(false);
  });

  it("checks roles", () => {
    expect(hasRole(["viewer"], "viewer")).toBe(true);
    expect(hasRole(["viewer"], "super_admin")).toBe(false);
  });
});
