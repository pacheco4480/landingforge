import { describe, expect, it } from "vitest";

import { isReleaseExportBoundToPreview } from "@/features/briefings/project-release-approval";

const now = new Date("2026-10-27T12:00:00.000Z");
const checksums = {
  preview: "a".repeat(64),
  archive: "b".repeat(64),
};
const releaseExport = {
  id: "export-1",
  status: "READY",
  artifactChecksum: checksums.archive,
  sourceChecksum: checksums.preview,
  expiresAt: new Date("2026-10-28T12:00:00.000Z"),
};

describe("project release approval binding", () => {
  it("accepts only the ready export built from the current preview", () => {
    expect(
      isReleaseExportBoundToPreview({
        exportId: releaseExport.id,
        releaseChecksum: checksums.archive,
        previewChecksum: checksums.preview,
        currentPreviewChecksum: checksums.preview,
        releaseExport,
        now,
      }),
    ).toBe(true);
  });

  it.each([
    ["export ID", { exportId: "another-export" }],
    ["archive checksum", { releaseChecksum: checksums.preview }],
    ["source checksum", { previewChecksum: checksums.archive }],
    ["current preview", { currentPreviewChecksum: checksums.archive }],
    ["not-ready export", { releaseExport: { ...releaseExport, status: "FAILED" } }],
    ["expired export", { releaseExport: { ...releaseExport, expiresAt: now } }],
  ])("rejects a mismatched or expired %s", (_label, override) => {
    expect(
      isReleaseExportBoundToPreview({
        exportId: releaseExport.id,
        releaseChecksum: checksums.archive,
        previewChecksum: checksums.preview,
        currentPreviewChecksum: checksums.preview,
        releaseExport,
        now,
        ...override,
      }),
    ).toBe(false);
  });
});
