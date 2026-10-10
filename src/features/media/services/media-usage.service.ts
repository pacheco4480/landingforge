import { db } from "@/lib/db";

export async function getMediaUsage(mediaId: string) {
  const [logoUsage, faviconUsage, seoUsage, sectionUsage] = await Promise.all([
    db.siteSetting.count({ where: { logoMediaId: mediaId } }),
    db.siteSetting.count({ where: { faviconMediaId: mediaId } }),
    db.seoSetting.count({ where: { ogImageMediaId: mediaId } }),
    db.pageSection.count({
      where: {
        deletedAt: null,
        OR: [
          { content: { path: ["mediaId"], equals: mediaId } },
          { settings: { path: ["mediaId"], equals: mediaId } },
        ],
      },
    }),
  ]);

  return {
    total: logoUsage + faviconUsage + seoUsage + sectionUsage,
    logoUsage,
    faviconUsage,
    seoUsage,
    sectionUsage,
  };
}
