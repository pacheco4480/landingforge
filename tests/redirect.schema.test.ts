import { describe, expect, it } from "vitest";

import { redirectSchema } from "@/features/seo/schemas/redirect.schema";
import { hasRedirectLoop } from "@/features/seo/services/redirect.service";

describe("redirect schema", () => {
  it("accepts internal 301 redirects", () => {
    const redirect = redirectSchema.parse({
      fromPath: "/old",
      toPath: "/new",
      statusCode: 301,
    });

    expect(redirect.statusCode).toBe(301);
  });

  it("rejects loops and external URLs", () => {
    expect(() =>
      redirectSchema.parse({
        fromPath: "/same",
        toPath: "/same",
        statusCode: 301,
      }),
    ).toThrow();

    expect(() =>
      redirectSchema.parse({
        fromPath: "/old",
        toPath: "https://example.com",
        statusCode: 302,
      }),
    ).toThrow();
  });

  it("detects indirect redirect loops", () => {
    expect(
      hasRedirectLoop(
        [
          { fromPath: "/b", toPath: "/c" },
          { fromPath: "/c", toPath: "/a" },
        ],
        "/a",
        "/b",
      ),
    ).toBe(true);

    expect(
      hasRedirectLoop([{ fromPath: "/b", toPath: "/c" }], "/a", "/b"),
    ).toBe(false);
  });
});
