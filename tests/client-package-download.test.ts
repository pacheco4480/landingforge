import { describe, expect, it, vi } from "vitest";

import { requestPackageSaveTarget, writePackageToSaveTarget } from "@/features/exports/client-package-download";

describe("client package download", () => {
  it("requests a ZIP destination before generation when the browser supports it", async () => {
    const handle = { createWritable: vi.fn() } as unknown as FileSystemFileHandle;
    const picker = vi.fn().mockResolvedValue(handle);

    const result = await requestPackageSaveTarget("client.zip", picker);

    expect(result).toEqual({ kind: "selected", handle });
    expect(picker).toHaveBeenCalledWith({
      suggestedName: "client.zip",
      types: [{ description: "Pacote LandingForge (ZIP)", accept: { "application/zip": [".zip"] } }],
      excludeAcceptAllOption: true,
    });
  });

  it("uses the regular browser download when the save picker is unavailable", async () => {
    await expect(requestPackageSaveTarget("client.zip", undefined)).resolves.toEqual({ kind: "browser-download" });
  });

  it("uses the regular browser download when the user chooses not to open a save picker", async () => {
    const picker = vi.fn().mockResolvedValue({} as FileSystemFileHandle);
    const result = await requestPackageSaveTarget("client.zip", picker, false);

    expect(result).toEqual({ kind: "browser-download" });
    expect(picker).not.toHaveBeenCalled();
  });

  it("does not start export when the user cancels the save dialog", async () => {
    const picker = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));

    await expect(requestPackageSaveTarget("client.zip", picker)).resolves.toEqual({ kind: "cancelled" });
  });

  it("falls back to the browser download when the picker cannot open", async () => {
    const picker = vi.fn().mockRejectedValue(new DOMException("Unavailable", "NotAllowedError"));

    await expect(requestPackageSaveTarget("client.zip", picker)).resolves.toEqual({ kind: "browser-download" });
  });

  it("writes the ZIP and closes the selected destination", async () => {
    const writable = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    const handle = { createWritable: vi.fn().mockResolvedValue(writable) } as unknown as FileSystemFileHandle;
    const archive = new Blob(["zip"]);

    await writePackageToSaveTarget(handle, archive);

    expect(handle.createWritable).toHaveBeenCalledOnce();
    expect(writable.write).toHaveBeenCalledWith(archive);
    expect(writable.close).toHaveBeenCalledOnce();
    expect(writable.abort).not.toHaveBeenCalled();
  });

  it("aborts a failed file write so the caller can fall back safely", async () => {
    const failure = new Error("disk full");
    const writable = { write: vi.fn().mockRejectedValue(failure), close: vi.fn(), abort: vi.fn() };
    const handle = { createWritable: vi.fn().mockResolvedValue(writable) } as unknown as FileSystemFileHandle;

    await expect(writePackageToSaveTarget(handle, new Blob(["zip"]))).rejects.toBe(failure);
    expect(writable.abort).toHaveBeenCalledOnce();
    expect(writable.close).not.toHaveBeenCalled();
  });
});
