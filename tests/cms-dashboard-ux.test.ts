import { describe, expect, it } from "vitest";

import { getDashboardQuickActions } from "@/features/cms/dashboard/dashboard-widgets";
import { permissions } from "@/features/rbac/permissions";

describe("CMS dashboard quick actions", () => {
  it("shows only read destinations granted to the current role", () => {
    const actions = getDashboardQuickActions([
      permissions.dashboardRead,
      permissions.pagesRead,
      permissions.seoRead,
    ]);

    expect(actions.map(({ href }) => href)).toEqual(["/pages", "/seo"]);
  });

  it("does not expose quick actions when the role has no corresponding read permission", () => {
    expect(getDashboardQuickActions([permissions.dashboardRead])).toEqual([]);
  });
});
