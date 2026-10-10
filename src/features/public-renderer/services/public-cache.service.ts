import { revalidatePath, revalidateTag } from "next/cache";

export const publicPageCacheTag = "public-pages";

export function revalidatePublicPage(slug?: string | null) {
  revalidateTag(publicPageCacheTag, "max");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  if (slug) {
    revalidatePath(`/${slug}`);
  }
}
