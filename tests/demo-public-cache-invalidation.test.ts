import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  updateDemoSettings: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  updateTag: mocks.updateTag,
}));

vi.mock("@/features/content/services/demo.service", () => ({
  archiveDemo: vi.fn(),
  createDemo: vi.fn(),
  deleteDemo: vi.fn(),
  duplicateDemo: vi.fn(),
  updateDemoSettings: mocks.updateDemoSettings,
}));

vi.mock("@/features/rbac/permissions", () => ({
  permissions: { cmsWrite: "cms:write" },
}));

vi.mock("@/lib/auth/require-permission", () => ({
  requirePermission: mocks.requirePermission,
}));

import { updateDemoSettingsAction } from "@/features/content/actions/demo.actions";

describe("demo public route cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "qa-admin", roles: ["super_admin"] });
    mocks.updateDemoSettings.mockResolvedValue({
      previousSlug: "bakery-playful-demo-old",
      slug: "bakery-playful-demo",
    });
  });

  it("expires public data and invalidates both slugs after demo settings change", async () => {
    const formData = new FormData();
    formData.set("id", "qa-demo-id");
    formData.set("slug", "bakery-playful-demo");
    formData.set("demoStatus", "PUBLISHED");
    formData.set("pageStatus", "PUBLISHED");
    formData.set("portfolioVisible", "on");

    await updateDemoSettingsAction(formData);

    expect(mocks.updateTag).toHaveBeenCalledWith("public-pages");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/content");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/bakery-playful-demo");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/bakery-playful-demo-old");
  });
});
