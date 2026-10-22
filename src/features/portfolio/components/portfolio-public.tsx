import Image from "next/image";
import Link from "next/link";
import type { Form, FormField } from "@/generated/prisma/client";
import { PublicForm } from "@/features/public-renderer/components/forms/public-form";
import { getSecuritySettings } from "@/lib/security/security-settings.service";
import type { PublicPortfolioCard, PublicPortfolioItem } from "@/features/portfolio/services/portfolio.service";

type PortfolioFilters = {
  q?: string;
  industry?: string;
  template?: string;
  variant?: string;
};

type GlobalForm = Form & { fields: FormField[] };

export function PortfolioFilters({ data }: { data: Awaited<ReturnType<typeof import("@/features/portfolio/services/portfolio.service").getPortfolioFilters>> }) {
  return (
    <form action="/portfolio" className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
      <label className="grid gap-1 text-sm font-medium">Pesquisar
        <input className="h-11 rounded-md border px-3" defaultValue={data.filters.q} name="q" placeholder="Indústria ou template" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Indústria
        <select className="h-11 rounded-md border px-3" defaultValue={data.filters.industry} name="industry"><option value="">Todas</option>{data.industries.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}</select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Template
        <select className="h-11 rounded-md border px-3" defaultValue={data.filters.template} name="template"><option value="">Todos</option>{data.templates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Variante
        <select className="h-11 rounded-md border px-3" defaultValue={data.filters.variant} name="variant"><option value="">Todas</option>{data.variants.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </label>
      <button className="h-11 rounded-md bg-foreground px-5 font-semibold text-background" type="submit">Filtrar</button>
    </form>
  );
}

export function PortfolioGrid({ items }: { items: PublicPortfolioCard[] }) {
  if (!items.length) return <p className="rounded-lg border p-8 text-center text-muted-foreground">Não encontrámos demos com estes filtros.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => <PortfolioCard item={item} key={item.id} />)}
    </div>
  );
}

function PortfolioCard({ item }: { item: PublicPortfolioCard }) {
  const image = item.seoSetting?.ogImageMedia;
  return (
    <article className="group overflow-hidden rounded-lg border bg-white">
      <Link aria-label={`Ver ${item.title}`} className="block" href={`/templates/${item.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {image?.publicUrl ? <Image alt={image.altText || `Pré-visualização de ${item.title}`} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" src={image.publicUrl} /> : <div className="absolute inset-0 grid place-items-center text-sm text-neutral-500">Pré-visualização por adicionar</div>}
        </div>
        <div className="grid gap-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{item.template?.industry.name}</p>
          <p className="text-xs text-neutral-500">Projeto demonstrativo · marca e conteúdo fictícios</p>
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="text-sm leading-6 text-neutral-600">{item.seoSetting?.metaDescription || item.templateVariant?.description || item.template?.description || "Demonstração de landing page."}</p>
          <p className="text-sm font-medium">{item.template?.name}{item.templateVariant ? ` · ${item.templateVariant.name}` : ""}</p>
        </div>
      </Link>
    </article>
  );
}

export function PortfolioIndustryLinks({ industries }: { industries: { key: string; name: string }[] }) {
  if (!industries.length) return null;
  return <nav aria-label="Indústrias com demos publicadas" className="flex flex-wrap gap-2">{industries.map((industry) => <Link className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/industries/${industry.key}`} key={industry.key}>{industry.name}</Link>)}</nav>;
}

export async function PortfolioInquiry({ form, contactEmail }: { form: GlobalForm | null; contactEmail: string | null }) {
  const security = form ? await getSecuritySettings() : null;
  return (
    <section className="grid gap-7 rounded-lg bg-neutral-950 p-6 text-white sm:p-10 lg:grid-cols-[0.8fr_1.2fr]" id="contact">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-300">Próximo passo</p>
        <h2 className="mt-3 text-3xl font-semibold">Vamos falar do seu projeto?</h2>
        <p className="mt-3 max-w-lg leading-7 text-neutral-300">Partilhe o que pretende alcançar e a equipa LandingForge entrará em contacto.</p>
        {!form && contactEmail ? <a className="mt-5 inline-block underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a> : null}
        {!form && !contactEmail ? <p className="mt-5 text-sm text-neutral-300">O formulário de contacto ainda não está configurado.</p> : null}
      </div>
      {form ? <div className="rounded-md bg-white p-5 text-neutral-900 sm:p-7"><PublicForm formId={form.id} pageId={null} fields={form.fields} gdprConsentLabel={form.gdprConsentLabel} gdprConsentRequired={form.gdprConsentRequired} gdprConsentVersion={form.gdprConsentVersion} turnstileSiteKey={security?.turnstileEnabled ? security.turnstileSiteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : null} /></div> : null}
    </section>
  );
}

export function PortfolioShowcase({ item }: { item: PublicPortfolioItem }) {
  const mainImage = item.seoSetting?.ogImageMedia;
  const sectionNames = [...new Set(item.sections.map((section) => sectionLabel(section.sectionType)).filter(Boolean))];
  const publicScreenshots = item.portfolioScreenshots.filter((shot) => shot.mediaAsset?.publicUrl);
  return (
    <>
      <header className="grid gap-6 border-b pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <Link className="text-sm underline underline-offset-4" href="/portfolio">← Voltar ao portfolio</Link>
          <p className="mt-7 text-sm font-semibold uppercase tracking-wide text-neutral-500">{item.template?.industry.name} · {item.templateVariant?.name ?? item.template?.name}</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{item.title}</h1>
          <p className="mt-3 text-sm text-neutral-500">Projeto demonstrativo · marca e conteúdo fictícios</p>
          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-600">{item.seoSetting?.metaDescription || item.templateVariant?.description || item.template?.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-md bg-neutral-950 px-5 py-3 font-semibold text-white" href={`/${item.slug}`} rel="nofollow">Ver demo</a>
            <Link className="rounded-md border px-5 py-3 font-semibold" href="/portfolio#contact">Pedir orçamento</Link>
          </div>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100">
          {mainImage?.publicUrl ? <Image alt={mainImage.altText || item.title} className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 50vw" src={mainImage.publicUrl} /> : <div className="absolute inset-0 grid place-items-center text-neutral-500">Pré-visualização por adicionar</div>}
        </div>
      </header>
      <div className="grid gap-10 py-10 lg:grid-cols-[1fr_2fr]">
        <aside className="grid content-start gap-6">
          <InfoGroup title="Estrutura" items={sectionNames} empty="Secções visíveis da demo." />
          <InfoGroup title="Formulários" items={item.forms.map((form) => form.name)} empty="Sem formulários publicados nesta demo." />
          <InfoGroup title="SEO" items={[item.seoSetting?.metaTitle ? "Título e descrição configurados" : "Metadados a completar", item.seoSetting ? "Imagem social configurada" : "Imagem social não configurada"]} />
          <InfoGroup title="CMS" items={["Conteúdo organizado por secções", "Campos editáveis variam conforme a demo"]} />
        </aside>
        <section aria-labelledby="screenshots-title">
          <h2 className="text-2xl font-semibold" id="screenshots-title">Capturas da demo</h2>
          {publicScreenshots.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2">{publicScreenshots.map((shot) => <figure className="overflow-hidden rounded-lg border" key={shot.id}><div className="relative aspect-[4/3] bg-neutral-100"><Image alt={shot.altText} className="object-cover" fill sizes="(max-width: 640px) 100vw, 50vw" src={shot.mediaAsset!.publicUrl!} /></div><figcaption className="p-3 text-sm text-neutral-600">{shot.category} · {shot.viewport}</figcaption></figure>)}</div> : <p className="mt-4 rounded-md border p-5 text-sm text-neutral-600">Ainda não foram publicadas capturas adicionais. A demo completa pode ser aberta no botão acima.</p>}
        </section>
      </div>
    </>
  );
}

function sectionLabel(sectionType: string) {
  const key = sectionType.toLowerCase();
  if (key.includes("hero")) return "Apresentação";
  if (key.includes("service") || key.includes("specialt")) return "Serviços";
  if (key.includes("testimonial") || key.includes("review")) return "Testemunhos";
  if (key.includes("faq")) return "Perguntas frequentes";
  if (key.includes("contact") || key.includes("location")) return "Contacto e localização";
  if (key.includes("team") || key.includes("doctor")) return "Equipa";
  if (key.includes("gallery") || key.includes("portfolio")) return "Galeria";
  if (key.includes("property")) return "Imóveis";
  if (key.includes("menu") || key.includes("product")) return "Produtos e menu";
  if (key.includes("process")) return "Processo";
  return "Conteúdo editorial";
}

function InfoGroup({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return <section><h2 className="font-semibold">{title}</h2>{items.length ? <ul className="mt-2 grid gap-1 text-sm leading-6 text-neutral-600">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-neutral-600">{empty}</p>}</section>;
}

export function portfolioJsonLd(data: Record<string, unknown>) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
