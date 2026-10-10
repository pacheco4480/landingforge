import { afterEach, describe, expect, it } from "vitest";

import {
  getDeploymentMode,
  getRuntimeDeploymentEnvironment,
  isCmsEnabled,
} from "@/config/deployment";

describe("deployment config", () => {
  const originalCms = process.env.CMS_ENABLED;
  const originalDemo = process.env.INTERNAL_DEMO_MODE;
  const originalVercel = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.CMS_ENABLED = originalCms;
    process.env.INTERNAL_DEMO_MODE = originalDemo;
    process.env.VERCEL_ENV = originalVercel;
  });

  it("enables CMS only with explicit true", () => {
    process.env.CMS_ENABLED = "true";
    expect(isCmsEnabled()).toBe(true);

    process.env.CMS_ENABLED = "false";
    expect(isCmsEnabled()).toBe(false);
  });

  it("uses internal demo mode only when explicitly configured", () => {
    process.env.INTERNAL_DEMO_MODE = "true";
    expect(getDeploymentMode()).toBe("INTERNAL_DEMO");

    process.env.INTERNAL_DEMO_MODE = "false";
    expect(getDeploymentMode()).toBe("CLIENT");
  });

  it("maps Vercel environments to deployment environments", () => {
    process.env.VERCEL_ENV = "production";
    expect(getRuntimeDeploymentEnvironment()).toBe("PRODUCTION");

    process.env.VERCEL_ENV = "preview";
    expect(getRuntimeDeploymentEnvironment()).toBe("PREVIEW");

    process.env.VERCEL_ENV = undefined;
    expect(getRuntimeDeploymentEnvironment()).toBe("LOCAL");
  });
});
