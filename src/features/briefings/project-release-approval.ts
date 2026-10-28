export type ReleaseExportReference = {
  id: string;
  status: string;
  artifactChecksum: string | null;
  sourceChecksum: string | null;
  expiresAt: Date;
};

export function isReleaseExportBoundToPreview(input: {
  exportId: string | null;
  releaseChecksum: string | null;
  previewChecksum: string | null;
  currentPreviewChecksum: string | null;
  releaseExport: ReleaseExportReference | null;
  now?: Date;
}) {
  const { releaseExport } = input;
  return Boolean(
    releaseExport &&
      input.exportId === releaseExport.id &&
      input.releaseChecksum &&
      input.releaseChecksum === releaseExport.artifactChecksum &&
      input.previewChecksum &&
      input.previewChecksum === releaseExport.sourceChecksum &&
      input.previewChecksum === input.currentPreviewChecksum &&
      releaseExport.status === "READY" &&
      releaseExport.expiresAt > (input.now ?? new Date()),
  );
}
