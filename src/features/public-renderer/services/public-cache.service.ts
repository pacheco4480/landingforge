import { revalidatePath, updateTag } from "next/cache";

export const publicPageCacheTag = "public-pages";

export function revalidatePublicPage(slug?: string | null) {
  updateTag(publicPageCacheTag);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  if (slug) {
    revalidatePath(`/${slug}`);
  }
}
