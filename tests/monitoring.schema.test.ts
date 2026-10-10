import { describe, expect, it } from "vitest";

import {
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import { monitoringLogSchema } from "@/features/monitoring/schemas/monitoring.schema";

describe("monitoring schema", () => {
  it("accepts structured monitoring logs", () => {
    const parsed = monitoringLogSchema.parse({
      level: SystemLogLevel.ERROR,
      source: SystemLogSource.API,
      message: "Health check failed",
      action: "deployment.health",
      metadata: { status: 503 },
    });

    expect(parsed.source).toBe(SystemLogSource.API);
  });

  it("rejects empty messages", () => {
    expect(() =>
      monitoringLogSchema.parse({
        level: SystemLogLevel.ERROR,
        source: SystemLogSource.API,
        message: "",
      }),
    ).toThrow();
  });
});
