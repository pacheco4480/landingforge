import { describe, expect, it } from "vitest";

import { getAuthorizedNavigation } from "@/features/cms/navigation/cms-navigation";
import { permissions } from "@/features/rbac/permissions";

describe("getAuthorizedNavigation", () => {
  it("shows only navigation items allowed by permissions", () => {
    const items = getAuthorizedNavigation([
      permissions.dashboardRead,
      permissions.leadsRead,
    ]);

    expect(items.map((item) => item.label)).toEqual([
      "Dashboard",
      "Leads",
      "Analytics",
      "Notifications",
    ]);
  });

  it("keeps restricted administration hidden without users permissions", () => {
    const items = getAuthorizedNavigation([
      permissions.dashboardRead,
      permissions.pagesRead,
      permissions.cmsRead,
      permissions.mediaRead,
      permissions.seoRead,
      permissions.settingsRead,
    ]);

    expect(items.some((item) => item.label === "Admin")).toBe(false);
  });

  it("keeps internal Client and Project workspaces hidden without dedicated permissions", () => {
    const items = getAuthorizedNavigation([
      permissions.dashboardRead,
      permissions.pagesRead,
      permissions.leadsRead,
    ]);

    expect(items.some((item) => item.label === "Clients")).toBe(false);
    expect(items.some((item) => item.label === "Projects")).toBe(false);
  });

  it("does not show global admin with audit-only permissions", () => {
    const items = getAuthorizedNavigation([
      permissions.dashboardRead,
      permissions.auditRead,
      permissions.auditExport,
    ]);

    expect(items.some((item) => item.label === "Admin")).toBe(false);
  });

  it("shows global admin only with admin access permission", () => {
    const items = getAuthorizedNavigation([
      permissions.dashboardRead,
      permissions.adminAccess,
    ]);

    expect(items.some((item) => item.label === "Admin")).toBe(true);
  });
});
