import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStructuredDataForPage } from "@/features/seo/services/seo-metadata.service";
import {
  generatePageMetadataBySlug,
  getCachedPublishedPageBySlug,
} from "@/features/seo/services/seo-metadata.service";
import { PublicPageRenderer } from "@/features/public-renderer/components/public-page-renderer";
import { StructuredDataScript } from "@/features/public-renderer/components/structured-data-script";
import {
  listPublishedPageSlugs,
} from "@/features/public-renderer/services/public-page.service";

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await listPublishedPageSlugs();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadataBySlug(slug);
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getCachedPublishedPageBySlug(slug);
  if (!context) notFound();
  const structuredData = await getStructuredDataForPage(context.page.id);

  return (
    <>
      <StructuredDataScript data={structuredData} />
      <PublicPageRenderer context={context} />
    </>
  );
}
