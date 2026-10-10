import {
  getDeploymentMode,
  getPublicSiteUrl,
  getRuntimeDeploymentEnvironment,
  isCmsEnabled,
  isInternalDemoModeEnabled,
} from "@/config/deployment";
import { deploymentSettingsSchema } from "@/features/deployment/schemas/deployment.schema";
import { db } from "@/lib/db";

export type DeliveryChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  description: string;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function requiredEnvironmentChecks(cmsEnabled: boolean) {
  const checks = [
    {
      key: "database",
      label: "Base de dados",
      complete: hasEnv("DATABASE_URL"),
      description: "DATABASE_URL configurado.",
    },
    {
      key: "site_url",
      label: "URL pública",
      complete: hasEnv("NEXT_PUBLIC_SITE_URL") || hasEnv("VERCEL_URL"),
      description: "URL pública usada em metadata, sitemap e canonical.",
    },
    {
      key: "cron_secret",
      label: "Cron seguro",
      complete: hasEnv("CRON_SECRET"),
      description: "CRON_SECRET configurado para tarefas automáticas.",
    },
  ];

  if (!cmsEnabled) return checks;

  return [
    ...checks,
    {
      key: "auth_secret",
      label: "Autenticação",
      complete: hasEnv("AUTH_SECRET"),
      description: "AUTH_SECRET configurado para sessões seguras.",
    },
    {
      key: "auth_url",
      label: "URL de autenticação",
      complete: hasEnv("AUTH_URL"),
      description: "AUTH_URL configurado para o domínio do deploy.",
    },
  ];
}

export function buildDeliveryChecklist({
  cmsEnabled,
  domain,
  domainConnected,
  sslActive,
  hasPublishedPage,
  hasSeoSettings,
  hasBranding,
}: {
  cmsEnabled: boolean;
  domain: string | null;
  domainConnected: boolean;
  sslActive: boolean;
  hasPublishedPage: boolean;
  hasSeoSettings: boolean;
  hasBranding: boolean;
}): DeliveryChecklistItem[] {
  return [
    {
      key: "published_page",
      label: "Landing publicada",
      complete: hasPublishedPage,
      description: "Existe pelo menos uma landing publicada.",
    },
    {
      key: "branding",
      label: "Branding aplicado",
      complete: hasBranding,
      description: "Nome, cores e identidade base estão configurados.",
    },
    {
      key: "seo",
      label: "SEO configurado",
      complete: hasSeoSettings,
      description: "Metadata pública preparada para a landing.",
    },
    {
      key: "domain",
      label: "Domínio configurado",
      complete: Boolean(domain) && domainConnected,
      description: "Domínio do cliente definido e marcado como ligado.",
    },
    {
      key: "ssl",
      label: "SSL ativo",
      complete: sslActive,
      description: "Certificado SSL marcado como ativo.",
    },
    {
      key: "cms_mode",
      label: cmsEnabled ? "CMS ativo" : "Landing only",
      complete: true,
      description: cmsEnabled
        ? "Modo Landing + CMS configurado."
        : "Modo Landing Only configurado.",
    },
    ...requiredEnvironmentChecks(cmsEnabled),
  ];
}

export async function getDeploymentWorkspace() {
  const cmsEnabled = isCmsEnabled();
  const runtimeMode = getDeploymentMode();
  const runtimeEnvironment = getRuntimeDeploymentEnvironment();

  const [clientSettings, site, publishedPage, seoSetting] = await Promise.all([
    db.clientSetting.findFirst(),
    db.siteSetting.findFirst({
      select: {
        id: true,
        siteName: true,
        businessName: true,
        businessType: true,
        domain: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
      },
    }),
    db.page.findFirst({
      where: { deletedAt: null, status: "PUBLISHED", isDemo: false },
      select: { id: true, title: true, slug: true },
    }),
    db.seoSetting.findFirst({
      where: { page: { deletedAt: null, status: "PUBLISHED", isDemo: false } },
      select: { id: true },
    }),
  ]);

  if (!clientSettings) {
    throw new Error("Client settings are not configured.");
  }

  const domain = site?.domain ?? null;
  const checklist = buildDeliveryChecklist({
    cmsEnabled,
    domain,
    domainConnected: clientSettings.domainStatus === "CONNECTED",
    sslActive: clientSettings.sslStatus === "ACTIVE",
    hasPublishedPage: Boolean(publishedPage),
    hasSeoSettings: Boolean(seoSetting),
    hasBranding: Boolean(
      site?.businessName &&
        site.primaryColor &&
        site.secondaryColor &&
        site.accentColor,
    ),
  });
  const completedItems = checklist.filter((item) => item.complete).length;

  return {
    cmsEnabled,
    internalDemoModeEnabled: isInternalDemoModeEnabled(),
    publicSiteUrl: getPublicSiteUrl(),
    runtimeMode,
    runtimeEnvironment,
    clientSettings,
    site,
    publishedPage,
    checklist,
    completedItems,
    totalItems: checklist.length,
    readyComputed: checklist.every((item) => item.complete),
  };
}

export async function getDeploymentSummary() {
  const workspace = await getDeploymentWorkspace();

  return {
    cmsEnabled: workspace.cmsEnabled,
    mode: workspace.runtimeMode,
    environment: workspace.runtimeEnvironment,
    deploymentStatus: workspace.clientSettings.deploymentStatus,
    domain: workspace.site?.domain ?? null,
    domainStatus: workspace.clientSettings.domainStatus,
    sslStatus: workspace.clientSettings.sslStatus,
    readyForDelivery: workspace.clientSettings.readyForDelivery,
    completedItems: workspace.completedItems,
    totalItems: workspace.totalItems,
    readyComputed: workspace.readyComputed,
  };
}

export async function updateDeploymentSettings(input: unknown, userId: string) {
  const data = deploymentSettingsSchema.parse(input);
  const [clientSettings, site] = await Promise.all([
    db.clientSetting.findFirstOrThrow(),
    db.siteSetting.findFirstOrThrow(),
  ]);

  const [updatedClientSettings, updatedSite] = await db.$transaction([
    db.clientSetting.update({
      where: { id: clientSettings.id },
      data: {
        deploymentMode: data.deploymentMode,
        deploymentEnvironment: data.deploymentEnvironment,
        deploymentStatus: data.deploymentStatus,
        domainStatus: data.domainStatus,
        sslStatus: data.sslStatus,
        readyForDelivery: data.readyForDelivery,
        lastDeploymentCheckAt: new Date(),
      },
    }),
    db.siteSetting.update({
      where: { id: site.id },
      data: { domain: data.domain },
    }),
    db.auditLog.create({
      data: {
        userId,
        action: "deployment.update",
        entityType: "client_setting",
        entityId: clientSettings.id,
        oldValues: {
          deploymentStatus: clientSettings.deploymentStatus,
          domainStatus: clientSettings.domainStatus,
          sslStatus: clientSettings.sslStatus,
          readyForDelivery: clientSettings.readyForDelivery,
          domain: site.domain,
        },
        newValues: {
          deploymentStatus: data.deploymentStatus,
          domainStatus: data.domainStatus,
          sslStatus: data.sslStatus,
          readyForDelivery: data.readyForDelivery,
          domain: data.domain,
        },
      },
    }),
  ]);

  return { clientSettings: updatedClientSettings, site: updatedSite };
}
