import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { purgeExpiredClientPackageExports } = vi.hoisted(() => ({ purgeExpiredClientPackageExports: vi.fn() }));

vi.mock("@/features/exports/services/client-package-export-retention", () => ({ purgeExpiredClientPackageExports }));

import { GET } from "@/app/api/cron/client-package-expiry/route";

describe("client package expiry cron route", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    purgeExpiredClientPackageExports.mockResolvedValue({ count: 3 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects a missing or incorrect bearer secret before purging", async () => {
    const missing = await GET(new NextRequest("http://localhost/api/cron/client-package-expiry"));
    const incorrect = await GET(new NextRequest("http://localhost/api/cron/client-package-expiry", {
      headers: { authorization: "Bearer wrong-secret" },
    }));

    expect(missing.status).toBe(401);
    expect(incorrect.status).toBe(401);
    expect(purgeExpiredClientPackageExports).not.toHaveBeenCalled();
  });

  it("purges and reports only the count after a valid bearer secret", async () => {
    const response = await GET(new NextRequest("http://localhost/api/cron/client-package-expiry", {
      headers: { authorization: "Bearer test-cron-secret" },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ expiredExportsDeleted: 3 });
    expect(purgeExpiredClientPackageExports).toHaveBeenCalledOnce();
  });
});
