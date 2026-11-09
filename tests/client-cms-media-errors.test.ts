import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  projectId: "950e8400-e29b-41d4-a716-446655440000",
  actor: null as unknown,
  provider: {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: { from: () => state.provider } }),
}));
vi.mock("@/features/exports/client-runtime/cms/authorization", () => ({
  requireClientCmsActor: async () => state.actor,
  getActorInstallation: (actor: { installation: unknown }) => actor.installation,
}));
vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => ({ query: vi.fn() }),
  withClientCmsTransaction: async (operation: (client: { query: (sql: string) => Promise<{ rows: unknown[] }> }) => Promise<unknown>) =>
    operation({ query: async (sql) => ({ rows: sql.includes("INSERT INTO lf_cms_media") ? [{
      id: "media-qa",
      object_path: `${state.projectId}/asset.png`,
      filename: "asset.png",
      mime_type: "image/png",
      size_bytes: 68,
      alt_text: "Imagem QA",
      created_at: new Date("2026-11-09T12:00:00Z"),
    }] : [] }) }),
}));

import { uploadClientCmsMedia } from "@/features/exports/client-runtime/cms/media.service";
import { ClientCmsMediaError } from "@/features/exports/client-runtime/cms/media-errors";

const environmentKeys = [
  "CLIENT_CMS_SUPABASE_URL",
  "CLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY",
  "CLIENT_CMS_PUBLIC_MEDIA_BUCKET",
] as const;
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZL8AAAAASUVORK5CYII=",
  "base64",
);

function uploadFile() {
  return new File([png], "imagem QA.png", { type: "image/png" });
}

describe("Client CMS media provider feedback", () => {
  beforeEach(() => {
    process.env.CLIENT_CMS_SUPABASE_URL = "https://storage.example.invalid";
    process.env.CLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY = "synthetic-test-key";
    process.env.CLIENT_CMS_PUBLIC_MEDIA_BUCKET = "qa-media";
    state.actor = {
      userId: "user-qa",
      projectId: state.projectId,
      role: "client_admin",
      authorizationVersion: 1,
      installation: { projectId: state.projectId },
    };
    state.provider.upload.mockReset().mockResolvedValue({ error: null });
    state.provider.getPublicUrl.mockReset().mockReturnValue({ data: { publicUrl: "https://storage.example.invalid/qa-media/asset.png" } });
    state.provider.remove.mockReset().mockResolvedValue({ error: null });
  });

  afterEach(() => {
    for (const key of environmentKeys) {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns a safe setup message when Storage is not configured", async () => {
    delete process.env.CLIENT_CMS_SUPABASE_URL;
    await expect(uploadClientCmsMedia(uploadFile())).rejects.toMatchObject({
      name: "ClientCmsMediaError",
      code: "storage_not_configured",
      message: expect.stringContaining("Contacta o suporte"),
    });
    expect(state.provider.upload).not.toHaveBeenCalled();
  });

  it("normalizes provider rejection without leaking provider details", async () => {
    state.provider.upload.mockRejectedValue(new Error("DNS failed: synthetic-secret-host"));
    const result = await uploadClientCmsMedia(uploadFile()).catch((error: unknown) => error);
    expect(result).toBeInstanceOf(ClientCmsMediaError);
    expect(result).toMatchObject({ code: "storage_unavailable" });
    expect(result.message).toContain("Tenta novamente mais tarde");
    expect(result.message).not.toContain("synthetic-secret-host");
  });

  it("normalizes provider errors and continues to support a valid upload", async () => {
    state.provider.upload.mockResolvedValueOnce({ error: { message: "synthetic provider detail" } });
    await expect(uploadClientCmsMedia(uploadFile())).rejects.toMatchObject({ code: "storage_unavailable" });
    expect(state.provider.upload).toHaveBeenCalledTimes(1);

    const uploaded = await uploadClientCmsMedia(uploadFile(), "Imagem QA");
    expect(uploaded).toMatchObject({
      id: "media-qa",
      filename: "asset.png",
      alt_text: "Imagem QA",
      publicUrl: "https://storage.example.invalid/qa-media/asset.png",
    });
    expect(String(uploaded.object_path)).toMatch(new RegExp(`^${state.projectId}/`));
  });
});
