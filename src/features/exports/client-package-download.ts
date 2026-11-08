type PackageSaveTarget =
  | { kind: "selected"; handle: FileSystemFileHandle }
  | { kind: "browser-download" }
  | { kind: "cancelled" };

type PackageSavePicker = (options: {
  suggestedName: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
  excludeAcceptAllOption: boolean;
}) => Promise<FileSystemFileHandle>;

export async function requestPackageSaveTarget(
  suggestedName: string,
  picker: PackageSavePicker | undefined,
  chooseSaveLocation = true,
): Promise<PackageSaveTarget> {
  if (!chooseSaveLocation || !picker) return { kind: "browser-download" };

  try {
    const handle = await picker({
      suggestedName,
      types: [{ description: "Pacote LandingForge (ZIP)", accept: { "application/zip": [".zip"] } }],
      excludeAcceptAllOption: true,
    });
    return { kind: "selected", handle };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { kind: "cancelled" };
    return { kind: "browser-download" };
  }
}

export async function writePackageToSaveTarget(handle: FileSystemFileHandle, archive: Blob) {
  const writable = await handle.createWritable();
  try {
    await writable.write(archive);
    await writable.close();
  } catch (error) {
    try {
      await writable.abort();
    } catch {
      // Preserve the original write error for the browser-download fallback.
    }
    throw error;
  }
}
