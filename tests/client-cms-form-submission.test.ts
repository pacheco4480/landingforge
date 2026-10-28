import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, transactionMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => ({ query: queryMock }),
  withClientCmsTransaction: transactionMock,
}));
vi.mock("server-only", () => ({}));

import {
  assertClientCmsSubmissionLimit,
  submitClientCmsLead,
} from "@/features/exports/client-runtime/cms/form-submission.service";

describe("client CMS public form protections", () => {
  let previousEnvironment: Record<string, string | undefined>;

  beforeEach(() => {
    vi.clearAllMocks();
    previousEnvironment = {
      CLIENT_CMS_PROJECT_ID: process.env.CLIENT_CMS_PROJECT_ID,
      CLIENT_CMS_RATE_LIMIT_SECRET: process.env.CLIENT_CMS_RATE_LIMIT_SECRET,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    };
    process.env.CLIENT_CMS_PROJECT_ID = "950e8400-e29b-41d4-a716-446655440000";
    process.env.CLIENT_CMS_RATE_LIMIT_SECRET = "test-only-rate-limit-secret";
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.unstubAllGlobals();
  });

  it("allows eight requests per window and rejects the ninth using an HMAC key", async () => {
    let requestCount = 0;
    queryMock.mockImplementation(async () => ({
      rows: [{ request_count: ++requestCount }],
    }));

    for (let request = 0; request < 8; request += 1) {
      await expect(assertClientCmsSubmissionLimit("203.0.113.24")).resolves.toBeUndefined();
    }
    await expect(assertClientCmsSubmissionLimit("203.0.113.24"))
      .rejects.toThrow("Foram enviados demasiados pedidos.");

    expect(queryMock).toHaveBeenCalledTimes(9);
    expect(queryMock.mock.calls[0][1]?.[1]).not.toBe("203.0.113.24");
  });

  it("rejects an invalid Turnstile response without persisting a lead", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitClientCmsLead({
      formKey: "contact",
      values: { name: "QA" },
      consentGiven: true,
      consentVersion: "1.0",
      turnstileToken: "invalid-test-token",
    })).rejects.toThrow("A verificação anti-spam expirou.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
