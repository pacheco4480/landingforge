import { afterEach, describe, expect, it } from "vitest";

import { getPageVisibilityFilter } from "@/features/content/services/page.service";

describe("getPageVisibilityFilter", () => {
  const originalDemoMode = process.env.INTERNAL_DEMO_MODE;

  afterEach(() => {
    process.env.INTERNAL_DEMO_MODE = originalDemoMode;
  });

  it("allows an authorized project operator to open provisioned pages in demo mode", () => {
    process.env.INTERNAL_DEMO_MODE = "true";

    expect(getPageVisibilityFilter(["super_admin"], {
      id: "operator-1",
      roles: ["super_admin"],
      permissions: ["projects.write"],
    })).toEqual({
      OR: [
        { isDemo: true },
        {
          provisionedVersions: {
            some: { project: { deletedAt: null } },
          },
        },
      ],
    });
  });

  it("does not expose provisioned pages to actors without project write access", () => {
    process.env.INTERNAL_DEMO_MODE = "true";

    expect(getPageVisibilityFilter(["super_admin"], {
      id: "reader-1",
      roles: ["super_admin"],
      permissions: ["pages.read"],
    })).toEqual({ OR: [{ isDemo: true }] });
  });

  it("limits non-admin project operators to projects assigned to them", () => {
    process.env.INTERNAL_DEMO_MODE = "true";

    expect(getPageVisibilityFilter(["project_operator"], {
      id: "operator-2",
      roles: ["project_operator"],
      permissions: ["projects.write"],
    })).toEqual({
      OR: [
        { isDemo: false },
        {
          provisionedVersions: {
            some: {
              project: {
                deletedAt: null,
                assignments: { some: { userId: "operator-2" } },
              },
            },
          },
        },
      ],
    });
  });
});
