import { describe, expect, it } from "vitest";

import {
  assertMaintenanceCodeChangesWithinLimits,
  maintenanceReleaseSourceChecksum,
  sourceChecksum,
  validateMaintenanceCodeChangeInput,
} from "@/features/projects/services/maintenance-code-changes";

describe("managed maintenance code changes", () => {
  it("only accepts an explicitly allowlisted source file", () => {
    const allowedSourcePaths = ["src/features/public-renderer/templates/gym/gym-modern.tsx"];
    expect(() => validateMaintenanceCodeChangeInput({
      sourcePath: allowedSourcePaths[0],
      content: "export const value = true;",
      allowedSourcePaths,
    })).not.toThrow();
    expect(() => validateMaintenanceCodeChangeInput({
      sourcePath: "../../.env",
      content: "secret",
      allowedSourcePaths,
    })).toThrow("allowlist");
  });

  it("invalidates release checksums when source changes change", () => {
    const checksum = sourceChecksum("source");
    const first = [{ sourcePath: "src/template.tsx", packagePath: "src/client-runtime/template.tsx", content: "first", baseChecksum: checksum, updatedByUserId: "operator", updatedAt: "2026-10-25T00:00:00.000Z" }];
    const second = [{ ...first[0], content: "second" }];
    expect(maintenanceReleaseSourceChecksum("snapshot", first)).not.toBe(maintenanceReleaseSourceChecksum("snapshot", second));
    expect(maintenanceReleaseSourceChecksum("snapshot", first)).not.toBe(maintenanceReleaseSourceChecksum("other-snapshot", first));
  });

  it("limits patch count and total size", () => {
    const changes = Array.from({ length: 13 }, (_, index) => ({
      sourcePath: `src/template-${index}.tsx`,
      packagePath: `src/client-runtime/template-${index}.tsx`,
      content: "x",
      baseChecksum: "a".repeat(64),
      updatedByUserId: "operator",
      updatedAt: "2026-10-25T00:00:00.000Z",
    }));
    expect(() => assertMaintenanceCodeChangesWithinLimits(changes)).toThrow("12 ficheiros");
    expect(() => assertMaintenanceCodeChangesWithinLimits([{ ...changes[0], content: "x".repeat(300_001) }])).toThrow("300 KB");
  });
});
