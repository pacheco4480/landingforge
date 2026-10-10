import { describe, expect, it } from "vitest";

import { deploymentSettingsSchema } from "@/features/deployment/schemas/deployment.schema";

describe("deploymentSettingsSchema", () => {
  const validInput = {
    deploymentMode: "CLIENT",
    deploymentEnvironment: "PRODUCTION",
    deploymentStatus: "READY",
    domain: "cliente.pt",
    domainStatus: "CONNECTED",
    sslStatus: "ACTIVE",
    readyForDelivery: "true",
  };

  it("accepts valid deployment settings", () => {
    const result = deploymentSettingsSchema.parse(validInput);

    expect(result.domain).toBe("cliente.pt");
    expect(result.readyForDelivery).toBe(true);
  });

  it("normalizes an empty domain to null", () => {
    const result = deploymentSettingsSchema.parse({
      ...validInput,
      domain: "",
    });

    expect(result.domain).toBeNull();
  });

  it("rejects domains with protocol or path", () => {
    expect(() =>
      deploymentSettingsSchema.parse({
        ...validInput,
        domain: "https://cliente.pt/admin",
      }),
    ).toThrow();
  });
});
