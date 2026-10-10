import { describe, expect, it } from "vitest";

import {
  monitoringFingerprint,
  sanitizeMonitoringMetadata,
} from "@/features/monitoring/services/sanitize.service";

describe("monitoring sanitizer", () => {
  it("redacts sensitive fields recursively", () => {
    const sanitized = sanitizeMonitoringMetadata({
      email: "client@example.com",
      password: "secret",
      nested: {
        token: "reset-token",
        cookie: "session-cookie",
      },
    });

    expect(sanitized).toEqual({
      email: "client@example.com",
      password: "[Redacted]",
      nested: {
        token: "[Redacted]",
        cookie: "[Redacted]",
      },
    });
  });

  it("builds stable fingerprints", () => {
    expect(
      monitoringFingerprint({
        source: "api",
        action: "deployment.health",
        message: "Database connection failed",
      }),
    ).toBe("api:deployment-health:database-connection-failed");
  });
});
