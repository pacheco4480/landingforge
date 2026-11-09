import { afterEach, describe, expect, it } from "vitest";

import {
  assertCanManageDemos,
  InternalDemosUnavailableError,
} from "@/features/content/services/demo.service";

const originalInternalDemoMode = process.env.INTERNAL_DEMO_MODE;

afterEach(() => {
  if (originalInternalDemoMode === undefined) delete process.env.INTERNAL_DEMO_MODE;
  else process.env.INTERNAL_DEMO_MODE = originalInternalDemoMode;
});

describe("internal demo availability", () => {
  it("classifies disabled internal demos for an authorized administrator", () => {
    process.env.INTERNAL_DEMO_MODE = "false";
    expect(() => assertCanManageDemos(["super_admin"])).toThrow(InternalDemosUnavailableError);
  });

  it("does not convert an unauthorized role into the availability state", () => {
    process.env.INTERNAL_DEMO_MODE = "false";
    try {
      assertCanManageDemos(["viewer"]);
      throw new Error("Expected access to be denied.");
    } catch (error) {
      expect(error).not.toBeInstanceOf(InternalDemosUnavailableError);
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("continues to allow an authorized administrator when the mode is enabled", () => {
    process.env.INTERNAL_DEMO_MODE = "true";
    expect(() => assertCanManageDemos(["super_admin"])).not.toThrow();
  });
});
