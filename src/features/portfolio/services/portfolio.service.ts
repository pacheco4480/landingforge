import { DemoStatus, PageStatus, Prisma } from "@/generated/prisma/client";
import { cache } from "react";
import { portfolioFilterSchema, portfolioVisibilitySchema } from "@/features/portfolio/schemas/portfolio.schema";
import { publicPortfolioWhere } from "@/features/portfolio/policies/public-portfolio.policy";
import { db } from "@/lib/db";

const portfolioCardSelect = {
  id: true,
  title: true,
  slug: true,
  updatedAt: true,
  portfolioOrder: true,
  template: { select: { id: true, key: true, name: true, description: true, industry: { select: { key: true, name: true, description: true } } } },
  templateVariant: { select: { id: true, key: true, name: true, description: true } },
  seoSetting: { select: { metaDescription: true, metaTitle: true, ogTitle: true, ogDescription: true, ogImageMedia: { select: { publicUrl: true, altText: true } } } },
} satisfies Prisma.PageSelect;

const portfolioSelect = {
  ...portfolioCardSelect,
  sections: { where: { deletedAt: null, isVisible: true }, orderBy: { sortOrder: "asc" as const }, select: { sectionType: true } },
  forms: { where: { deletedAt: null, isActive: true, status: "PUBLISHED" as const }, select: { name: true, type: true, fields: { where: { isVisible: true }, select: { id: true } } } },
  portfolioScreenshots: { where: { deletedAt: null, isPublic: true, consentState: { not: "rejected" }, category: { notIn: ["cms", "dashboard"] }, mediaAsset: { is: { deletedAt: null, publicUrl: { not: null } } } }, orderBy: { sortOrder: "asc" as const }, select: { id: true, category: true, viewport: true, altText: true, sourceRoute: true, mediaAsset: { select: { publicUrl: true } } } },
} satisfies Prisma.PageSelect;

export type PublicPortfolioItem = Prisma.PageGetPayload<{ select: typeof portfolioSelect }>;
export type PublicPortfolioCard = Prisma.PageGetPayload<{ select: typeof portfolioCardSelect }>;

export async function getPortfolioFilters(input: unknown) {
  const filters = portfolioFilterSchema.parse(input);
  const conditions: Prisma.PageWhereInput[] = [publicPortfolioWhere];
  if (filters.industry) conditions.push({ template: { is: { industry: { is: { key: filters.industry } } } } });
  if (filters.template) conditions.push({ templateId: filters.template });
  if (filters.variant) conditions.push({ templateVariantId: filters.variant });
  if (filters.q) {
    conditions.push({ OR: [
      { title: { contains: filters.q, mode: "insensitive" } },
      { template: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
      { templateVariant: { is: { name: { contains: filters.q, mode: "insensitive" } } } },
      { template: { is: { industry: { is: { name: { contains: filters.q, mode: "insensitive" } } } } } },
    ] });
  }

  const [items, industries] = await Promise.all([
    db.page.findMany({ where: { AND: conditions }, select: portfolioCardSelect, orderBy: [{ portfolioOrder: "asc" }, { publishedAt: "desc" }], take: 80 }),
    db.industry.findMany({
      where: { isActive: true, templates: { some: { pages: { some: publicPortfolioWhere } } } },
      select: { key: true, name: true }, orderBy: { name: "asc" },
    }),
  ]);
  const [templates, variants] = await Promise.all([db.template.findMany({
    where: { isActive: true, pages: { some: publicPortfolioWhere } },
    select: { id: true, name: true }, orderBy: { name: "asc" },
  }), db.templateVariant.findMany({
    where: { isActive: true, pages: { some: publicPortfolioWhere } },
    select: { id: true, name: true }, orderBy: { name: "asc" },
  })]);
  return { items, industries, templates, variants, filters };
}

export const getPortfolioItemBySlug = cache(async (slug: string) =>
  db.page.findFirst({ where: { ...publicPortfolioWhere, slug }, select: portfolioSelect }),
);

export const getPortfolioIndustryByKey = cache(async (key: string) => {
  const industry = await db.industry.findFirst({
    where: { key, isActive: true, templates: { some: { pages: { some: publicPortfolioWhere } } } },
    select: { key: true, name: true, description: true },
  });
  if (!industry) return null;
  const items = await db.page.findMany({
    where: { ...publicPortfolioWhere, template: { is: { industry: { is: { key } } } } },
    select: portfolioCardSelect,
    orderBy: [{ portfolioOrder: "asc" }, { publishedAt: "desc" }],
    take: 80,
  });
  return { industry, items };
});

export async function getPortfolioInquiryForm() {
  return db.form.findFirst({
    where: { key: "landingforge-portfolio", pageId: null, status: "PUBLISHED", isActive: true, deletedAt: null },
    include: { fields: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPortfolioContactDetails() {
  return db.siteSetting.findFirst({ select: { businessName: true, contactEmail: true, contactPhone: true, domain: true } });
}

export async function listPublicPortfolioSitemapEntries() {
  const items = await db.page.findMany({ where: publicPortfolioWhere, select: { slug: true, updatedAt: true, template: { select: { industry: { select: { key: true } } } } }, take: 80 });
  if (items.length === 0) return [];
  const latest = items.reduce((current, item) => item.updatedAt > current ? item.updatedAt : current, items[0]!.updatedAt);
  const industries = [...new Set(items.map((item) => item.template?.industry.key).filter((key): key is string => Boolean(key)))];
  return [
    { path: "/portfolio", updatedAt: latest, priority: 0.7 },
    ...industries.map((key) => ({ path: `/industries/${key}`, updatedAt: latest, priority: 0.6 })),
    ...items.map((item) => ({ path: `/templates/${item.slug}`, updatedAt: item.updatedAt, priority: 0.65 })),
  ];
}

export async function getPortfolioManagement() {
  const [items, assets] = await Promise.all([
    db.page.findMany({
      where: { isDemo: true, deletedAt: null },
      orderBy: [{ portfolioOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true, title: true, slug: true, status: true, demoStatus: true,
        portfolioVisible: true, portfolioOrder: true,
        template: { select: { name: true, industry: { select: { name: true } } } },
        templateVariant: { select: { name: true } },
        seoSetting: { select: { ogImageMedia: { select: { publicUrl: true, deletedAt: true } } } },
        portfolioScreenshots: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { mediaAsset: true } },
      },
    }),
    db.mediaAsset.findMany({ where: { deletedAt: null, mimeType: { startsWith: "image/" }, publicUrl: { not: null } }, orderBy: { createdAt: "desc" }, take: 80, select: { id: true, filename: true, publicUrl: true, altText: true } }),
  ]);
  return { items, assets };
}

export async function updatePortfolioVisibility(input: unknown, userId: string) {
  const data = portfolioVisibilitySchema.parse(input);
  const page = await db.page.findFirst({
    where: { id: data.pageId, isDemo: true, deletedAt: null },
    select: { status: true, demoStatus: true, seoSetting: { select: { ogImageMedia: { select: { publicUrl: true, deletedAt: true } } } }, template: { select: { isActive: true, industry: { select: { isActive: true } } } }, templateVariant: { select: { isActive: true } } },
  });
  if (!page) throw new Error("Demo não encontrada.");
  if (data.isPublic && (page.status !== PageStatus.PUBLISHED || page.demoStatus !== DemoStatus.PUBLISHED || !page.template?.isActive || !page.template.industry.isActive || !page.templateVariant?.isActive || !page.seoSetting?.ogImageMedia?.publicUrl || page.seoSetting.ogImageMedia.deletedAt)) {
    throw new Error("A demo tem de estar publicada, usar uma variante ativa e ter uma imagem social pública configurada.");
  }
  await db.$transaction([
    db.page.update({ where: { id: data.pageId }, data: { portfolioVisible: data.isPublic, portfolioOrder: data.sortOrder } }),
    db.auditLog.create({ data: { userId, action: data.isPublic ? "portfolio.publish" : "portfolio.hide", entityType: "page", entityId: data.pageId, newValues: { isPublic: data.isPublic, sortOrder: data.sortOrder } } }),
  ]);
}
