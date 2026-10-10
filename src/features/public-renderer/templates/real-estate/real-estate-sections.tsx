import Image from "next/image";
import { Bath, BedDouble, CheckCircle2, MapPin, Maximize2 } from "lucide-react";

import type { PublicRendererContext, PublicSectionProps } from "@/features/public-renderer/types";
import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import {
  isRecord,
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import {
  realEstateToneClasses,
  realEstateVariant,
  recordArray,
  recordText,
  variantLabel,
} from "@/features/public-renderer/templates/real-estate/real-estate-utils";

function brandKitText(content: unknown, key: string, fallback = "") {
  if (!isRecord(content) || !isRecord(content.brandKit)) return fallback;

  const value = content.brandKit[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function RealEstateHeroSection({
  section,
  context,
}: PublicSectionProps) {
  const variant = realEstateVariant(context);
  const properties = recordArray(section.content, "properties");
  const stats = recordArray(section.content, "stats");
  const featured = properties[0];

  if (variant === "local_agency") {
    return (
      <LocalAgencyHero
        context={context}
        featured={featured}
        section={section}
        stats={stats}
      />
    );
  }

  if (variant === "premium") {
    return (
      <PremiumHero
        context={context}
        featured={featured}
        section={section}
        stats={stats}
      />
    );
  }

  const tone = realEstateToneClasses(variant);

  return (
    <PublicBand className="pt-16 sm:pt-24">
      <div
        className={`grid overflow-hidden rounded-md lg:grid-cols-[1.02fr_0.98fr] ${tone.hero}`}
      >
        <div className="p-6 sm:p-10 lg:p-12">
          <p
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone.badge}`}
          >
            {text(section.content, "eyebrow", variantLabel(variant))}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            {text(section.content, "headline", context.page.title)}
          </h1>
          <p className={`mt-5 max-w-2xl text-lg leading-8 ${tone.muted}`}>
            {text(
              section.content,
              "subheadline",
              "Imóveis selecionados, acompanhamento claro e visitas bem preparadas.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="public-button-primary" href="#contact">
              {text(section.content, "ctaPrimary", "Pedir contacto")}
            </a>
            <a className="public-button-outline" href="#featured-properties">
              {text(section.content, "ctaSecondary", "Ver imóveis")}
            </a>
          </div>
          {stats.length ? (
            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div className={`rounded-md border p-4 ${tone.card}`} key={index}>
                  <dt className="text-xs uppercase tracking-wide opacity-70">
                    {itemText(stat, "label", "Metric")}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold">
                    {itemText(stat, "value", "0")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="min-h-[420px] p-4 sm:p-6">
          <PropertyShowcase property={featured} variant={variant} />
        </div>
      </div>
    </PublicBand>
  );
}

function PremiumHero({
  context,
  featured,
  section,
  stats,
}: {
  context: PublicRendererContext;
  featured?: Record<string, unknown>;
  section: PublicSectionProps["section"];
  stats: Record<string, unknown>[];
}) {
  return (
    <PublicBand className="-mt-8 overflow-hidden pb-14 sm:-mt-10 lg:-mt-12">
      <div className="relative overflow-hidden rounded-md border border-slate-200/80 bg-[#f4f1ec] p-5 shadow-2xl shadow-slate-950/10 sm:p-8 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--public-accent)]/70 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--public-accent)]/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-white/70 blur-3xl"
        />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-900/10 bg-white/75 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--public-primary)] shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--public-accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--public-accent)]" />
            </span>
              {text(section.content, "eyebrow", "Vanguard Private Wealth Real Estate")}
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.75rem]">
              {text(section.content, "headline", context.page.title)}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {text(
                section.content,
                "subheadline",
                "Uma experiência editorial e orientada a dados para compradores, vendedores e investidores que exigem exceção em cada detalhe.",
              )}
            </p>

            <div className="mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
              {[
                "Dossiers privados",
                "Contactos qualificados",
                "Market intelligence",
              ].map((label) => (
                <div
                  className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5"
                  key={label}
                >
                  <CheckCircle2 className="size-4 text-[var(--public-primary)]" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-md border border-slate-900/10 bg-white/68 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--public-primary)]">
                Brand promise
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {brandKitText(
                  section.content,
                  "corePromise",
                  "Consultoria premium com narrativa, dados e acompanhamento discreto.",
                )}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {brandKitText(section.content, "tagline", "Curated homes. Sharper decisions.")}
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--public-primary)] px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
                href="#contact"
              >
                <span>{text(section.content, "ctaPrimary", "Agendar reunião privada")}</span>
                <span className="text-base">&rarr;</span>
              </a>
              <a
                className="inline-flex items-center justify-center rounded-md border border-slate-900/10 bg-white/80 px-7 py-3.5 text-sm font-black text-slate-950 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-900/20 hover:bg-white hover:shadow-md"
                href="#featured-properties"
              >
                {text(section.content, "ctaSecondary", "Ver casas selecionadas")}
              </a>
            </div>

            {stats.length ? (
              <div className="mt-12 border-t border-slate-900/10 pt-7">
                <dl className="grid grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col">
                      <dt className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        {itemText(stat, "label", "Metric")}
                      </dt>
                      <dd className="mt-1.5 text-2xl font-black tracking-tight text-[var(--public-primary)] sm:text-3xl">
                        {itemText(stat, "value", "0")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute -left-5 top-10 z-20 hidden max-w-56 rounded-md border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Private dossier
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">24h</p>
              <p className="mt-1 text-[11px] font-semibold leading-normal text-slate-500">
                Envio de ficha, contexto de mercado e próximo passo recomendado.
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 z-20 hidden max-w-64 rounded-md bg-slate-950 p-4 text-white shadow-2xl transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--public-accent)]">
                Compradores certos
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-200">
                Apresentação cuidada, contexto de mercado e contactos com intenção real.
              </p>
            </div>
            <PropertyShowcase property={featured} variant="premium" />
          </div>
        </div>
        <div className="relative mt-10 grid gap-3 border-t border-slate-900/10 pt-6 sm:grid-cols-3">
          {[
            ["Nota de mercado", "Preço, narrativa e procura alinhados antes da publicação."],
            ["Caminho privado", "Contacto reservado antes de visitas e partilha de detalhes sensíveis."],
            ["História da casa", "Dossier visual e argumentos de venda preparados com cuidado editorial."],
          ].map(([label, value]) => (
            <div
              className="rounded-md bg-white/58 p-4 text-sm shadow-sm ring-1 ring-slate-900/6 backdrop-blur"
              key={label}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--public-primary)]">
                {label}
              </p>
              <p className="mt-2 leading-6 text-slate-600">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

function LocalAgencyHero({
  context,
  featured,
  section,
  stats,
}: {
  context: PublicSectionProps["context"];
  featured?: Record<string, unknown>;
  section: PublicSectionProps["section"];
  stats: Record<string, unknown>[];
}) {
  return (
    <PublicBand className="overflow-hidden pt-8 sm:pt-14 lg:pt-16">
      <div className="relative overflow-hidden rounded-md bg-[#f7faf8] p-5 shadow-2xl shadow-slate-900/6 ring-1 ring-black/5 sm:p-8 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-[var(--public-accent)]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[var(--public-primary)]/10 blur-3xl"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--public-primary)] shadow-md shadow-slate-200/50 ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[var(--public-accent)] animate-pulse" />
              {text(section.content, "eyebrow", context.site.businessName || "Aura Living")}
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {text(section.content, "headline", context.page.title)}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {text(
                section.content,
                "subheadline",
                "Apoio personalizado para quem procura comprar, vender ou investir com transparência e conhecimento local real.",
              )}
            </p>

            <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
              {[
                "Avaliação sem pressão",
                "Bairros acompanhados",
                "Visitas qualificadas",
              ].map((label) => (
                <div
                  className="flex items-center gap-2 rounded-md bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5"
                  key={label}
                >
                  <CheckCircle2 className="size-4 text-[var(--public-primary)]" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-md border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--public-primary)]">
                Marca de bairro
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {brandKitText(
                  section.content,
                  "corePromise",
                "Comprar ou vender com alguém que conhece a rua, não apenas o mercado.",
                )}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {brandKitText(section.content, "tagline", "Casas com critério de bairro.")}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--public-primary)]/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-100"
                href="#valuation"
              >
                <span>{text(section.content, "ctaPrimary", "Solicitar avaliação gratuita")}</span>
                <span className="text-base">&rarr;</span>
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                href="#featured-properties"
              >
                {text(section.content, "ctaSecondary", "Ver imóveis de bairro")}
              </a>
            </div>

            {stats.length ? (
              <dl className="mt-10 grid gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <div
                    className="rounded-md border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:shadow-md"
                    key={index}
                  >
                    <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      {itemText(stat, "label", "Prova local")}
                    </dt>
                    <dd className="mt-1 text-2xl font-black text-[var(--public-primary)]">
                      {itemText(stat, "value", "0")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-6 z-20 hidden max-w-56 rounded-md border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:block">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Agilidade de Venda
                </p>
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900">
                29 dias
              </p>
              <p className="mt-1 text-[11px] font-medium leading-normal text-slate-500">
                Tempo medio de proposta em zonas de elevada procura.
              </p>
            </div>

            <div className="absolute -bottom-5 -right-3 z-20 hidden max-w-60 rounded-md bg-slate-900 p-4 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--public-accent)]">
                Garantia de Transparência
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-200">
                Análise comparativa de mercado real antes de qualquer compromisso.
              </p>
            </div>

            <PropertyShowcase property={featured} variant="local_agency" />
          </div>
        </div>
        <div className="relative mt-10 rounded-md border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-4">
            {["Campo de Ourique", "Estrela", "Avenidas Novas", "Alvalade"].map((area) => (
              <a
                className="flex items-center justify-between rounded-md bg-[#f7faf8] px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                href="#local-expertise"
                key={area}
              >
                <span>{area}</span>
                <span aria-hidden="true" className="text-[var(--public-primary)]">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

export function FeaturedPropertiesSection({ section, context }: PublicSectionProps) {
  const list = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="featured-properties" className="py-16">
        <SectionHeading
          title={text(section.content, "title", "Casas premium em destaque")}
          description={text(section.content, "text", "Uma seleção rigorosa de casas com liquidez, arquitetura e narrativa comercial fortes.")}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {list.map((property, index) => (
            <article
              className="group overflow-hidden rounded-md border border-slate-200/80 bg-white text-[var(--public-text)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              key={index}
            >
              <PropertyImage property={property} />
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex rounded-full bg-[var(--public-primary)]/8 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[var(--public-primary)]">
                    {itemText(property, "status", "Disponível")}
                  </span>
                  <span className="text-xs font-bold text-[var(--public-muted)] uppercase tracking-wider">
                    {itemText(property, "type", "Residencial")}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-tight line-clamp-2">
                  {itemText(property, "title", "Imovel Premium")}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--public-muted)]">
                  <MapPin className="size-4 text-[var(--public-primary)]" aria-hidden="true" />
                  {itemText(property, "location", "Localização")}
                </p>
                <PropertyMeta property={property} />
                <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                  <p className="text-2xl font-extrabold text-[var(--public-primary)]">
                    {itemText(property, "price", "Preço sob consulta")}
                  </p>
                  <a
                    className="inline-flex items-center gap-1 text-sm font-bold text-[var(--public-primary)] hover:underline"
                    href="#contact"
                  >
                    <span>Ver detalhes</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="featured-properties">
      <SectionHeading
        title={text(section.content, "title", "Imóveis em destaque")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((property, index) => (
          <article
            className={`group overflow-hidden rounded-md border border-slate-200/80 bg-white p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
              index === 0 ? "xl:col-span-2" : ""
            }`}
            key={index}
          >
            <PropertyImage property={property} />
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-[var(--public-primary)]">
                <span className="rounded-full bg-[var(--public-primary)]/8 px-2.5 py-1">
                  {itemText(property, "status", "Disponível")}
                </span>
                <span aria-hidden="true">/</span>
                <span>{itemText(property, "type", "Imovel")}</span>
              </div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                {itemText(property, "title", "Imovel em destaque")}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="size-4 text-[var(--public-primary)]" aria-hidden="true" />
                {itemText(property, "location", "Localização a definir")}
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <p className="text-2xl font-bold text-[var(--public-primary)]">
                  {itemText(property, "price", "Preço sob consulta")}
                </p>
                <a
                  className="text-sm font-semibold text-[var(--public-text)] underline-offset-4 hover:underline"
                  href="#contact"
                >
                  Agendar visita
                </a>
              </div>
              <PropertyMetaClassic property={property} />
            </div>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function PropertyHighlightsSection({ section, context }: PublicSectionProps) {
  const list = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="services" className="py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeading
              title={text(section.content, "title", "Sistema premium de venda")}
              description={text(section.content, "text", "Curadoria, dados e apresentação cuidada para posicionar cada casa com critério.")}
            />
            <div className="mt-8 rounded-md border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--public-primary)]">
                Metodo Vela
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cada casa recebe uma narrativa, um dossier visual e uma rota de contacto pensada para compradores com intenção real.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {list.map((item, index) => (
            <article
              className={`group relative overflow-hidden rounded-md border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-[var(--public-text)] ${
                index === 0 ? "md:row-span-2 md:flex md:flex-col md:justify-end" : ""
              }`}
              key={index}
            >
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--public-primary)] via-[var(--public-accent)] to-transparent" />
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-sm font-black text-[var(--public-accent)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-xl font-black tracking-tight">
                {recordText(item, ["title", "name"], "Serviço imobiliário")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--public-muted)]">
                {recordText(item, ["description", "text"], "Detalhe partilhado pela equipa após o primeiro contacto.")}
              </p>
            </article>
          ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="services">
      <SectionHeading
        title={text(section.content, "title", "Acompanhamento imobiliario")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {list.map((item, index) => (
          <article
            className="public-card transition duration-300 hover:-translate-y-1 hover:border-[var(--public-primary)]/30 hover:shadow-lg"
            key={index}
          >
            <p className="text-sm font-semibold text-[var(--public-primary)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-lg font-semibold">
              {recordText(item, ["title", "name"], "Serviço imobiliário")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
              {recordText(item, ["description", "text"], "Detalhe partilhado pela equipa após o primeiro contacto.")}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function PropertyValuationSection({ section, context }: PublicSectionProps) {
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="valuation">
        <div className="relative overflow-hidden rounded-md border border-black/5 bg-gradient-to-br from-slate-950 via-[var(--public-primary)] to-slate-900 p-8 text-white shadow-2xl sm:p-14 lg:p-16">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.08))] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--public-accent)]/15 blur-2xl pointer-events-none"
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                {text(section.content, "eyebrow", "Consultoria de Valor")}
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {text(
                  section.content,
                  "headline",
                  "Conheça o valor real do seu ativo no mercado atual",
                )}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                {text(
                  section.content,
                  "text",
                  "Análise fundamentada com dados de mercado, posicionamento e estratégia de venda orientada a resultados.",
                )}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-widest text-white/55">
                Recebe no primeiro contacto
              </p>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-white/85">
                {["Mapa de comparáveis", "Estratégia de posicionamento", "Plano de captação visual"].map((item) => (
                  <li className="flex items-center gap-2" key={item}>
                    <CheckCircle2 className="size-4 text-[var(--public-accent)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                href="#contact"
              >
                <span>{text(section.content, "ctaPrimary", "Solicitar avaliação privada")}</span>
                <span className="text-base">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="valuation">
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-slate-900 via-[var(--public-primary)] to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--public-accent)]/20 blur-3xl pointer-events-none"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--public-accent)] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--public-accent)] animate-pulse" />
              {text(section.content, "eyebrow", "Avaliação Gratuita")}
            </span>
            <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl text-white">
              {text(
                section.content,
                "headline",
                "Quer saber quanto vale o seu imóvel no mercado atual?",
              )}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              {text(
                section.content,
                "text",
                "Receba uma orientação transparente baseada na localização, procura real do bairro e dados de transação recente.",
              )}
            </p>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--public-accent)] px-7 py-4 text-sm font-black text-slate-950 shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
            href="#contact"
          >
            <span>{text(section.content, "ctaPrimary", "Pedir Avaliação Gratuita")}</span>
            <span className="text-base">&rarr;</span>
          </a>
        </div>
      </div>
    </PublicBand>
  );
}

export function LocalAreaExpertiseSection({ section }: PublicSectionProps) {
  const areas = items(section.content);
  const proof = recordArray(section.content, "proof");

  return (
    <PublicBand id="local-expertise" className="py-16">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            title={text(section.content, "title", "Especialistas no Mercado de Bairro")}
            description={text(section.content, "text", "Dados transparentes de procura e tempos médios de resposta para si.")}
          />
          {proof.length ? (
            <dl className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {proof.map((item, index) => (
                <div
                  className="rounded-md border border-slate-200/80 bg-white p-5 shadow-md backdrop-blur-sm transition-all hover:border-slate-300 hover:shadow-lg"
                  key={index}
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {itemText(item, "label", "Prova local")}
                  </dt>
                  <dd className="mt-1.5 text-3xl font-black text-[var(--public-primary)]">
                    {itemText(item, "value", "0")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {areas.map((area, index) => {
            const areaImage = itemText(area, "image");
            const areaName = itemText(area, "name", "Zona local");

            return (
            <article
              className="group relative overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              key={index}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--public-primary)] to-[var(--public-accent)]"
              />
              {areaImage ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    alt={itemText(area, "imageAlt", areaName)}
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    fill
                    sizes="(min-width: 1024px) 27vw, (min-width: 768px) 45vw, 100vw"
                    src={areaImage}
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4 p-6 pb-0">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    {areaName}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {itemText(area, "profile", "Perfil da zona partilhado pela equipa local.")}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-600/20 shrink-0">
                  {itemText(area, "trend", "Alta Procura")}
                </span>
              </div>
              <dl className="m-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Preço médio</dt>
                  <dd className="mt-1 text-base font-black text-slate-900">
                    {itemText(area, "averagePrice", "Sob consulta")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Tempo médio</dt>
                  <dd className="mt-1 text-base font-black text-slate-900">
                    {itemText(area, "averageTime", "A confirmar")}
                  </dd>
                </div>
              </dl>
            </article>
            );
          })}
        </div>
      </div>
    </PublicBand>
  );
}

export function RealEstateAgentsSection({ section, context }: PublicSectionProps) {
  const agents = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="agents" className="py-16">
        <SectionHeading
          title={text(section.content, "title", "Advisors para decisões premium")}
          description={text(section.content, "text", "Uma equipa pequena e sénior para compradores exigentes, venda estratégica e investimento residencial.")}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {agents.map((agent, index) => {
            const image = itemText(agent, "image");
            const name = itemText(agent, "name", "Advisor");
            const role = itemText(agent, "role", "Premium advisor");

            return (
              <article
                className="group overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                key={index}
              >
                <div className="grid sm:grid-cols-[11rem_1fr]">
                  <div className="relative min-h-56 overflow-hidden bg-slate-100 sm:min-h-full">
                    {image ? (
                      <Image
                        alt={itemText(agent, "imageAlt", name)}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        fill
                        sizes="(min-width: 768px) 176px, 100vw"
                        src={image}
                      />
                    ) : (
                      <div className="flex h-full min-h-56 items-center justify-center bg-slate-950 text-4xl font-black text-white">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--public-primary)]">
                      {role}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {name}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      {itemText(agent, "bio", "")}
                    </p>
                    <div className="mt-6 grid gap-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-700">
                      {itemText(agent, "phone") ? <span>{itemText(agent, "phone")}</span> : null}
                      {itemText(agent, "email") ? <span>{itemText(agent, "email")}</span> : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="agents" className="py-16">
      <SectionHeading
        title={text(section.content, "title", "Consultores Dedicados")}
        description={text(section.content, "text", "Equipa com conhecimento local para garantir proximidade e apoio constante.")}
      />
      <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent, index) => {
          const image = itemText(agent, "image");
          const name = itemText(agent, "name", "Consultor");
          const role = itemText(agent, "role", "Especialista");

          return (
            <article
              className="group overflow-hidden rounded-md border border-slate-200/80 bg-white p-7 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              key={index}
            >
              <div className="flex items-center gap-5">
                {image ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md ring-4 ring-slate-100 shadow-md">
                    <Image
                      alt={name}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="80px"
                      src={image}
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-slate-900 text-2xl font-black text-white shadow-md">
                    {name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-900">{name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--public-primary)]">
                    {role}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-600 line-clamp-3">
                {itemText(agent, "bio", "")}
              </p>

              <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-700">
                {itemText(agent, "phone") ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">Tel</span>
                    <span>{itemText(agent, "phone")}</span>
                  </div>
                ) : null}
                {itemText(agent, "email") ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">@</span>
                    <span>{itemText(agent, "email")}</span>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function RealEstateProcessSection({ section, context }: PublicSectionProps) {
  const steps = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="process" className="py-16">
        <div className="rounded-md bg-[#f4f1ec] p-6 ring-1 ring-slate-900/5 sm:p-10">
          <SectionHeading
            title={text(section.content, "title", "Processo de venda orientado por dados")}
            description={text(section.content, "text", "Uma sequência clara para proteger valor, preparar visitas e acompanhar cada etapa com discrição.")}
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                className="group relative overflow-hidden rounded-md bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                key={index}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Step
                  </span>
                  <span className="text-3xl font-black text-[var(--public-primary)]/20">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-black tracking-tight text-slate-950">
                  {itemText(step, "title", "Etapa")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {itemText(step, "description", "Descrição do passo.")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="process" className="py-16">
      <SectionHeading
        title={text(section.content, "title", "Processo simples e transparente")}
        description={text(section.content, "text", "Passo a passo pensado para eliminar incertezas.")}
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
        {steps.map((step, index) => (
          <article
            className="group relative overflow-hidden rounded-md border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            key={index}
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-base font-black text-[var(--public-accent)] shadow-md">
              0{index + 1}
            </div>
            <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
              {itemText(step, "title", "Etapa")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {itemText(step, "description", "Descrição do passo.")}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}



export function LuxuryAdvisorySection({ section }: PublicSectionProps) {
  const list = items(section.content);

  return (
    <PublicBand id="luxury-advisory">
      <div className="rounded-md bg-slate-950 p-6 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-white/60">
              {text(section.content, "eyebrow", "Private advisory")}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">
              {text(
                section.content,
                "title",
                "Discrição, curadoria e negociação para ativos premium.",
              )}
            </h2>
            <p className="mt-4 leading-7 text-white/72">
              {text(
                section.content,
                "text",
                "Uma experiência pensada para compradores, vendedores e investidores que valorizam privacidade e acompanhamento especializado.",
              )}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {list.map((item, index) => (
              <div
                className="rounded-md border border-white/10 bg-white/8 p-4"
                key={index}
              >
                <h3 className="font-semibold">
                  {itemText(item, "title", "Serviço")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {itemText(item, "description", "Detalhe partilhado pela equipa após o primeiro contacto.")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

function PropertyShowcase({
  property,
  variant,
}: {
  property?: Record<string, unknown>;
  variant: string;
}) {
  if (!property) {
    return (
      <div className="flex h-full min-h-[380px] items-end rounded-md bg-gradient-to-br from-white/24 via-white/10 to-transparent p-5 backdrop-blur-md">
        <p className="text-sm font-semibold text-white/80">
          A equipa está a selecionar casas adequadas ao perfil de cada cliente.
        </p>
      </div>
    );
  }

  if (variant === "premium") {
    return (
      <article className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl text-slate-950">
        <PropertyImage property={property} priority />
        <div className="p-7">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--public-primary)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--public-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--public-primary)] animate-pulse" />
              {itemText(property, "tag", "Imóvel Curado")}
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {itemText(property, "status", "Exclusivo")}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900 leading-snug">
            {itemText(property, "title", "Imovel selecionado")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
            {itemText(property, "description", itemText(property, "location", ""))}
          </p>
          
          <PropertyMeta property={property} />

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço de Guia</span>
              <p className="text-2xl font-black text-[var(--public-primary)]">
                {itemText(property, "price", "Preço sob consulta")}
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--public-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[var(--public-primary)]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--public-primary)]/30"
              href="#contact"
            >
              <span>{itemText(property, "ctaLabel", "Solicitar Dossier")}</span>
              <span className="text-sm">&rarr;</span>
            </a>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-md border border-slate-200/80 bg-white p-2 text-slate-950 shadow-2xl shadow-slate-900/10 transition-all duration-300 hover:shadow-2xl">
      <div className="rounded-md overflow-hidden">
        <PropertyImage property={property} priority />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {itemText(property, "tag", "Destaque da Semana")}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {itemText(property, "location", "Lisboa")}
          </span>
        </div>
        <h3 className="mt-3.5 text-xl font-black tracking-tight text-slate-900">
          {itemText(property, "title", "Imóvel Selecionado")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
          {itemText(property, "description", "")}
        </p>

        <PropertyMetaClassic property={property} />

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xl font-black text-[var(--public-primary)]">
            {itemText(property, "price", "Preço sob consulta")}
          </p>
          <a
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-slate-800"
            href="#contact"
          >
            <span>{itemText(property, "ctaLabel", "Marcar Visita")}</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function PropertyImage({
  priority,
  property,
}: {
  priority?: boolean;
  property: Record<string, unknown>;
}) {
  const image = itemText(property, "image");
  const alt = itemText(property, "imageAlt", itemText(property, "title", ""));

  if (!image) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-[var(--public-primary)]/85 via-[var(--public-secondary)]/65 to-[var(--public-accent)]/80" />
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      <Image
        alt={alt}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        fill
        priority={priority}
        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        src={image}
        unoptimized
      />
    </div>
  );
}

function PropertyMeta({ property }: { property: Record<string, unknown> }) {
  const beds = itemText(property, "beds", "-");
  const baths = itemText(property, "baths", "-");
  const area = itemText(property, "area", "-");

  return (
    <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 text-sm text-[var(--public-muted)]">
      <div className="flex items-center gap-1.5">
        <BedDouble className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--public-primary)]" />
        <span>{beds} {beds !== "-" ? "Quartos" : ""}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Bath className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--public-primary)]" />
        <span>{baths} {baths !== "-" ? "Banhos" : ""}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Maximize2 className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--public-primary)]" />
        <span>{area}</span>
      </div>
    </div>
  );
}

function PropertyMetaClassic({ property }: { property: Record<string, unknown> }) {
  const meta = [
    ["beds", "Quartos"],
    ["baths", "Banhos"],
    ["area", "Area"],
  ] as const;

  return (
    <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
      {meta.map(([key, label]) => (
        <div
          className="rounded-md bg-[var(--public-surface)] p-3 text-center"
          key={key}
        >
          <dt className="text-xs text-[var(--public-muted)]">{label}</dt>
          <dd className="mt-1 font-semibold">
            {itemText(property, key, "-")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
