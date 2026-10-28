import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { query, verify } = vi.hoisted(() => ({
  query: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({ default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }) }));
vi.mock("next-auth/providers/credentials", () => ({ default: (options: unknown) => options }));
vi.mock("argon2", () => ({ verify }));
vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => ({ query }),
}));

import { authenticateClientCmsUser } from "@/features/exports/client-runtime/cms/auth";

describe("client CMS credentials authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CLIENT_CMS_PROJECT_ID", "project-test");
    vi.stubEnv("CLIENT_CMS_RATE_LIMIT_SECRET", "unit-test-secret");
    query.mockResolvedValueOnce({ rows: [{ request_count: 1 }] });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("does not authenticate when the password is invalid", async () => {
    query.mockResolvedValueOnce({ rows: [{
      id: "user-test",
      name: "Test User",
      email: "operator@example.test",
      password_hash: "argon-hash",
      role: "client_admin",
      authorization_version: 1,
    }] });
    verify.mockResolvedValueOnce(false);

    await expect(authenticateClientCmsUser({
      email: " OPERATOR@example.test ",
      password: "wrong-password",
    })).resolves.toBeNull();

    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed credentials before database access", async () => {
    await expect(authenticateClientCmsUser({ email: "not-an-email", password: "x" })).resolves.toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
});
