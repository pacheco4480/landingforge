import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioShowcase, portfolioJsonLd } from "@/features/portfolio/components/portfolio-public";
import { getPortfolioItemBySlug } from "@/features/portfolio/services/portfolio.service";
import { getPortfolioContactDetails } from "@/features/portfolio/services/portfolio.service";
import { normalizeSiteBaseUrl } from "@/features/seo/services/seo-url.service";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);
  if (!item) return { title: "Template não encontrado | LandingForge", robots: { index: false, follow: false } };
  return {
    title: item.seoSetting?.metaTitle || `${item.title} | LandingForge`,
    description: item.seoSetting?.metaDescription || item.templateVariant?.description || item.template?.description || item.title,
    alternates: { canonical: `/templates/${slug}` },
    openGraph: { title: item.seoSetting?.ogTitle || item.title, description: item.seoSetting?.ogDescription || item.seoSetting?.metaDescription || "Demo LandingForge", images: item.seoSetting?.ogImageMedia?.publicUrl ? [item.seoSetting.ogImageMedia.publicUrl] : [], type: "website" },
  };
}

export default async function PortfolioTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, contact] = await Promise.all([getPortfolioItemBySlug(slug), getPortfolioContactDetails()]);
  if (!item) notFound();
  const siteBase = normalizeSiteBaseUrl(contact?.domain);
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-10 text-neutral-950 sm:px-6 sm:py-16 lg:px-8">
      {portfolioJsonLd({ "@context": "https://schema.org", "@type": "WebPage", name: item.title, description: item.seoSetting?.metaDescription || item.title, url: `${siteBase}/templates/${item.slug}`, isPartOf: { "@type": "CollectionPage", name: "Portfolio LandingForge", url: `${siteBase}/portfolio` } })}
      <PortfolioShowcase item={item} />
    </main>
  );
}
