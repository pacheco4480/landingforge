import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortfolioGrid, portfolioJsonLd } from "@/features/portfolio/components/portfolio-public";
import { getPortfolioIndustryByKey } from "@/features/portfolio/services/portfolio.service";
import { getPortfolioContactDetails } from "@/features/portfolio/services/portfolio.service";
import { normalizeSiteBaseUrl } from "@/features/seo/services/seo-url.service";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPortfolioIndustryByKey(slug);
  if (!data) notFound();
  return {
    title: `Landing pages para ${data.industry.name} | LandingForge`,
    description: data.industry.description || `Explore demos de landing pages LandingForge para ${data.industry.name}.`,
    alternates: { canonical: `/industries/${slug}` },
    openGraph: { title: `Landing pages para ${data.industry.name} | LandingForge`, description: data.industry.description || `Demos disponíveis para ${data.industry.name}.`, type: "website" },
  };
}

export default async function PortfolioIndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, contact] = await Promise.all([getPortfolioIndustryByKey(slug), getPortfolioContactDetails()]);
  if (!data) notFound();
  const siteBase = normalizeSiteBaseUrl(contact?.domain);
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      {portfolioJsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: `Landing pages para ${data.industry.name}`, description: data.industry.description || `Demos de landing pages para ${data.industry.name}.`, url: `${siteBase}/industries/${slug}` })}
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <Link className="text-sm font-medium underline underline-offset-4" href="/portfolio">← Portfolio</Link>
        <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Indústria</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">{data.industry.name}</h1><p className="mt-4 text-lg leading-8 text-neutral-600">{data.industry.description || `Demos LandingForge para negócios de ${data.industry.name}.`}</p></header>
        <PortfolioGrid items={data.items} />
        <Link className="justify-self-start rounded-md bg-neutral-950 px-5 py-3 font-semibold text-white" href="/portfolio#contact">Pedir orçamento</Link>
      </div>
    </main>
  );
}
