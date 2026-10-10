import { PageStatus } from "@/generated/prisma/client";
import type { PublicRendererContext } from "@/features/public-renderer/types";
import { db } from "@/lib/db";

const pageInclude = {
  template: true,
  templateVariant: true,
  theme: true,
  seoSetting: true,
  sections: {
    where: { deletedAt: null, isVisible: true },
    orderBy: { sortOrder: "asc" },
  },
  forms: {
    where: { deletedAt: null },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  },
} as const;

export async function getPublishedPageBySlug(
  slug: string,
): Promise<PublicRendererContext | null> {
  const [site, page] = await Promise.all([
    db.siteSetting.findFirst({
      include: { logoMedia: { select: { publicUrl: true, altText: true } } },
    }),
    db.page.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PageStatus.PUBLISHED,
      },
      include: pageInclude,
    }),
  ]);

  if (!site || !page) return null;
  return { site, page };
}

export async function getPublishedPageMetadataBySlug(slug: string) {
  const [site, page] = await Promise.all([
    db.siteSetting.findFirst({
      select: {
        siteName: true,
        businessName: true,
        domain: true,
        logoMedia: { select: { publicUrl: true } },
      },
    }),
    db.page.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PageStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        seoSetting: {
          select: {
            metaTitle: true,
            metaDescription: true,
            canonicalUrl: true,
            ogTitle: true,
            ogDescription: true,
            twitterCardType: true,
            robotsIndex: true,
            robotsFollow: true,
            ogImageMedia: { select: { publicUrl: true } },
          },
        },
      },
    }),
  ]);

  if (!site || !page) return null;
  return { site, page };
}

export async function getPublishedPageStructuredData(pageId: string) {
  return db.page.findUniqueOrThrow({
    where: { id: pageId },
    select: {
      id: true,
      title: true,
      slug: true,
      pageType: true,
      template: { select: { key: true, name: true } },
      sections: {
        where: { deletedAt: null, isVisible: true },
        select: {
          id: true,
          sectionType: true,
          name: true,
          content: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      seoSetting: { select: { schemaJson: true } },
    },
  });
}

export async function getDemoPreviewPageById(
  id: string,
): Promise<PublicRendererContext | null> {
  const [site, page] = await Promise.all([
    db.siteSetting.findFirst({
      include: { logoMedia: { select: { publicUrl: true, altText: true } } },
    }),
    db.page.findFirst({
      where: { id, deletedAt: null, isDemo: true },
      include: pageInclude,
    }),
  ]);

  if (!site || !page) return null;
  return { site, page };
}

export async function listPublishedPageSlugs() {
  return db.page.findMany({
    where: { deletedAt: null, status: PageStatus.PUBLISHED },
    select: { slug: true },
  });
}
