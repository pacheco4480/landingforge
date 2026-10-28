export const CLIENT_CMS_TENANT_ISOLATION_VERSION = "1";

export function verifyClientCmsTenantIsolation() {
  const verifiedVersion = process.env.CLIENT_CMS_TENANT_ISOLATION_VERIFIED_VERSION?.trim();
  if (verifiedVersion !== CLIENT_CMS_TENANT_ISOLATION_VERSION) {
    return {
      passed: false as const,
      reason: "A versão atual da política de isolamento não foi atestada após o teste PostgreSQL.",
    };
  }
  return { passed: true as const, reason: null };
}
