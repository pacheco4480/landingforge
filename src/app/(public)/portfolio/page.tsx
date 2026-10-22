import type { Metadata } from "next";
import Link from "next/link";

import { PortfolioFilters, PortfolioGrid, PortfolioIndustryLinks, PortfolioInquiry, portfolioJsonLd } from "@/features/portfolio/components/portfolio-public";
import { getPortfolioContactDetails, getPortfolioFilters, getPortfolioInquiryForm } from "@/features/portfolio/services/portfolio.service";
import { normalizeSiteBaseUrl } from "@/features/seo/services/seo-url.service";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const { items } = await getPortfolioFilters({ q: stringParam(params.q), industry: stringParam(params.industry), template: stringParam(params.template), variant: stringParam(params.variant) });
  return {
    title: "Portfolio de landing pages | LandingForge",
    description: "Explore demos de landing pages LandingForge por indústria, template e variante.",
    alternates: { canonical: "/portfolio" },
    robots: items.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: "Portfolio de landing pages | LandingForge", description: "Explore demos de landing pages por indústria e variante.", type: "website" },
  };
}

export default async function PortfolioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [data, form, contact] = await Promise.all([
    getPortfolioFilters({ q: stringParam(params.q), industry: stringParam(params.industry), template: stringParam(params.template), variant: stringParam(params.variant) }),
    getPortfolioInquiryForm(),
    getPortfolioContactDetails(),
  ]);
  const siteBase = normalizeSiteBaseUrl(contact?.domain);
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      {portfolioJsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Portfolio LandingForge", description: "Demos de landing pages organizadas por indústria.", url: `${siteBase}/portfolio`, mainEntity: { "@type": "ItemList", itemListElement: data.items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: `${siteBase}/templates/${item.slug}`, name: item.title })) } })}
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <Link className="text-sm font-semibold" href="/portfolio">LandingForge</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-wide text-neutral-500">Demos selecionadas</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Landing pages pensadas para converter.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">Explore experiências reais de demonstração, organizadas por indústria e variante. Cada página pública corresponde a uma demo aprovada.</p>
        </header>
        <PortfolioIndustryLinks industries={data.industries} />
        <PortfolioFilters data={data} />
        <PortfolioGrid items={data.items} />
        <PortfolioInquiry form={form} contactEmail={contact?.contactEmail ?? null} />
        <footer className="border-t pt-5 text-sm text-neutral-500">LandingForge · Demos de apresentação</footer>
      </div>
    </main>
  );
}
