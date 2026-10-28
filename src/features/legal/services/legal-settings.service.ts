import { LegalDocumentType, PageStatus, PageType, Prisma } from "@/generated/prisma/client";
import { unstable_cache } from "next/cache";
import { legalSettingsSchema } from "@/features/legal/schemas/legal.schema";
import { db } from "@/lib/db";

const legalSlugs = {
  privacy: "politica-privacidade",
  cookies: "politica-cookies",
  terms: "termos-condicoes",
} as const;

function nullableId(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function getLegalSettingsWorkspace() {
  const [settings, legalPages] = await Promise.all([
    getOrCreateLegalSettings(),
    db.page.findMany({
      where: { pageType: PageType.LEGAL, deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true, status: true },
    }),
  ]);

  return { settings, legalPages };
}

export async function getPublicLegalSettings() {
  const settings = await getCachedPublicLegalSettings();
  return settings ?? getOrCreateLegalSettings();
}

const getCachedPublicLegalSettings = unstable_cache(
  async () => {
    const site = await db.siteSetting.findFirst({ select: { id: true } });
    if (!site) return null;

    return db.legalSetting.findUnique({
      where: { siteSettingId: site.id },
      include: {
        privacyPage: { select: { slug: true, title: true } },
        cookiePage: { select: { slug: true, title: true } },
        termsPage: { select: { slug: true, title: true } },
      },
    });
  },
  ["public-legal-settings"],
  { revalidate: 300 },
);

export async function saveLegalSettings(input: unknown, userId: string) {
  const data = legalSettingsSchema.parse(input);
  const current = await getOrCreateLegalSettings();
  const settings = await db.legalSetting.update({
    where: { id: current.id },
    data: {
      consentVersion: data.consentVersion,
      cookieBannerEnabled: data.cookieBannerEnabled,
      analyticsCookiesEnabled: data.analyticsCookiesEnabled,
      marketingCookiesEnabled: data.marketingCookiesEnabled,
      privacyPageId: nullableId(data.privacyPageId),
      cookiePageId: nullableId(data.cookiePageId),
      termsPageId: nullableId(data.termsPageId),
      retentionDays: data.retentionDays,
      dataControllerName: data.dataControllerName || null,
      dataControllerEmail: data.dataControllerEmail || null,
      updatedByUserId: userId,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "legal.settings.update",
      entityType: "legal_setting",
      entityId: settings.id,
      oldValues: {
        consentVersion: current.consentVersion,
        cookieBannerEnabled: current.cookieBannerEnabled,
      },
      newValues: {
        consentVersion: settings.consentVersion,
        cookieBannerEnabled: settings.cookieBannerEnabled,
      },
    },
  });

  return settings;
}

export async function ensureLegalPages(userId?: string) {
  const site = await getSite();
  const pages = await Promise.all([
    upsertLegalPage({
      slug: legalSlugs.privacy,
      title: "Política de Privacidade",
      type: LegalDocumentType.PRIVACY_POLICY,
      metaDescription:
        "Informacao sobre recolha, utilizacao e protecao de dados pessoais.",
      userId,
    }),
    upsertLegalPage({
      slug: legalSlugs.cookies,
      title: "Politica de Cookies",
      type: LegalDocumentType.COOKIE_POLICY,
      metaDescription:
        "Informacao sobre cookies necessarios, analytics, marketing e preferencias.",
      userId,
    }),
    upsertLegalPage({
      slug: legalSlugs.terms,
      title: "Termos e Condicoes",
      type: LegalDocumentType.TERMS,
      metaDescription:
        "Termos gerais de utilizacao e condicoes aplicaveis ao website.",
      userId,
    }),
  ]);

  const settings = await getOrCreateLegalSettings(site.id);
  await db.legalSetting.update({
    where: { id: settings.id },
    data: {
      privacyPageId: pages[0].id,
      cookiePageId: pages[1].id,
      termsPageId: pages[2].id,
      dataControllerName: settings.dataControllerName ?? site.businessName,
      dataControllerEmail: settings.dataControllerEmail ?? site.contactEmail,
    },
  });

  return pages;
}

async function getOrCreateLegalSettings(siteSettingId?: string) {
  const site = siteSettingId ? null : await getSite();
  const id = siteSettingId ?? site?.id;
  if (!id) throw new Error("Site settings not found.");

  return db.legalSetting.upsert({
    where: { siteSettingId: id },
    update: {},
    create: {
      siteSettingId: id,
      dataControllerName: site?.businessName ?? null,
      dataControllerEmail: site?.contactEmail ?? null,
    },
    include: {
      privacyPage: { select: { slug: true, title: true } },
      cookiePage: { select: { slug: true, title: true } },
      termsPage: { select: { slug: true, title: true } },
    },
  });
}

async function getSite() {
  const site = await db.siteSetting.findFirst();
  if (!site) throw new Error("Site settings not found.");
  return site;
}

async function upsertLegalPage({
  slug,
  title,
  type,
  metaDescription,
  userId,
}: {
  slug: string;
  title: string;
  type: LegalDocumentType;
  metaDescription: string;
  userId?: string;
}) {
  const page = await db.page.upsert({
    where: { slug },
    update: { pageType: PageType.LEGAL, status: PageStatus.PUBLISHED },
    create: {
      title,
      slug,
      status: PageStatus.PUBLISHED,
      pageType: PageType.LEGAL,
      publishedAt: new Date(),
    },
  });

  await db.seoSetting.upsert({
    where: { pageId: page.id },
    update: {
      metaTitle: `${title} LandingForge`,
      metaDescription,
      canonicalUrl: `http://localhost:3000/${slug}`,
      robotsIndex: true,
      robotsFollow: true,
    },
    create: {
      pageId: page.id,
      metaTitle: `${title} LandingForge`,
      metaDescription,
      canonicalUrl: `http://localhost:3000/${slug}`,
      robotsIndex: true,
      robotsFollow: true,
      twitterCardType: "summary",
    },
  });

  await db.pageSection.upsert({
    where: { pageId_sectionKey: { pageId: page.id, sectionKey: "legal-body" } },
    update: {
      name: title,
      content: defaultLegalContent(title, type) as Prisma.InputJsonValue,
    },
    create: {
      pageId: page.id,
      sectionKey: "legal-body",
      sectionType: "legal",
      name: title,
      sortOrder: 0,
      content: defaultLegalContent(title, type) as Prisma.InputJsonValue,
      settings: {},
    },
  });

  await db.legalDocumentVersion.upsert({
    where: { pageId_version: { pageId: page.id, version: "1.0" } },
    update: {},
    create: {
      pageId: page.id,
      type,
      version: "1.0",
      title,
      summary: metaDescription,
      content: defaultLegalContent(title, type) as Prisma.InputJsonValue,
      createdByUserId: userId,
    },
  });

  return page;
}

function defaultLegalContent(title: string, type: LegalDocumentType) {
  const intro =
    type === LegalDocumentType.COOKIE_POLICY
      ? "Esta pagina explica como usamos cookies necessarios, analytics e marketing."
      : type === LegalDocumentType.TERMS
        ? "Estes termos definem as condicoes gerais de utilizacao deste website."
        : "Esta pagina explica como recolhemos, usamos e protegemos dados pessoais.";

  return {
    title,
    text: intro,
    items: [
      {
        title: "Responsavel pelo tratamento",
        description: "Dados configuraveis no CMS em Settings.",
      },
      {
        title: "Finalidade",
        description:
          "Responder a pedidos enviados por formularios, gerir leads e melhorar a experiencia.",
      },
      {
        title: "Direitos do titular",
        description:
          "Pode solicitar acesso, correcao, exportacao ou eliminacao dos seus dados.",
      },
    ],
  };
}
