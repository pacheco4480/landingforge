import { afterEach, describe, expect, it } from "vitest";

import {
  CLIENT_CMS_TENANT_ISOLATION_VERSION,
  verifyClientCmsTenantIsolation,
} from "@/features/exports/services/client-cms-isolation-verification";

const originalValue = process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION;

afterEach(() => {
  if (originalValue === undefined) delete process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION;
  else process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION = originalValue;
});

describe("client CMS tenant-isolation release attestation", () => {
  it("blocks when the release has no attestation", () => {
    delete process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION;
    expect(verifyClientCmsTenantIsolation().passed).toBe(false);
  });

  it("blocks stale policy attestations", () => {
    process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION = "0";
    expect(verifyClientCmsTenantIsolation().passed).toBe(false);
  });

  it("allows export only for the current tested policy version", () => {
    process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION = CLIENT_CMS_TENANT_ISOLATION_VERSION;
    expect(verifyClientCmsTenantIsolation()).toEqual({ passed: true, reason: null });
  });
});
