export const deploymentModes = ["INTERNAL_DEMO", "CLIENT"] as const;
export const deploymentEnvironments = ["LOCAL", "PREVIEW", "PRODUCTION"] as const;
export const deploymentStatuses = [
  "NOT_STARTED",
  "CONFIGURING",
  "READY",
  "LIVE",
  "BLOCKED",
] as const;
export const domainStatuses = [
  "NOT_CONFIGURED",
  "PENDING",
  "CONNECTED",
  "ERROR",
] as const;
export const sslStatuses = [
  "NOT_CONFIGURED",
  "PENDING",
  "ACTIVE",
  "ERROR",
] as const;

export type DeploymentMode = (typeof deploymentModes)[number];
export type DeploymentEnvironment = (typeof deploymentEnvironments)[number];
export type DeploymentStatus = (typeof deploymentStatuses)[number];
export type DomainStatus = (typeof domainStatuses)[number];
export type SslStatus = (typeof sslStatuses)[number];

export function isCmsEnabled() {
  return process.env.CMS_ENABLED === "true";
}

export function isInternalDemoModeEnabled() {
  return process.env.INTERNAL_DEMO_MODE === "true";
}

export function getRuntimeDeploymentEnvironment(): DeploymentEnvironment {
  if (process.env.VERCEL_ENV === "production") return "PRODUCTION";
  if (process.env.VERCEL_ENV === "preview") return "PREVIEW";
  return "LOCAL";
}

export function getPublicSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getDeploymentMode(): DeploymentMode {
  return isInternalDemoModeEnabled() ? "INTERNAL_DEMO" : "CLIENT";
}
