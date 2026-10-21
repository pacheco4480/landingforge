import {
  EstateEditorialHero,
  EstateEditorialProperties,
  EstateEditorialServices,
  EstateEditorialValuation,
} from "./estate-editorial";
import Image from "next/image";
import { Bath, BedDouble, MapPin, Maximize2 } from "lucide-react";

import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import {
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

export function RealEstateHeroSection({
  section,
  context,
}: PublicSectionProps) {
  const variant = realEstateVariant(context);
  const properties = recordArray(section.content, "properties");
  const stats = recordArray(section.content, "stats");
  const featured = properties[0];

  if (variant === "local_agency" || variant === "premium") {
    return <EstateEditorialHero section={section} context={context} />;
  }

  const tone = realEstateToneClasses(variant);

  return (
    <PublicBand className="pt-16 sm:pt-24">
      <div
        className={`grid overflow-hidden rounded-md lg:grid-cols-[1.02fr_0.98fr] ${tone.hero}`}
      >
        <div className="p-6 sm:p-10 lg:p-12">
          <p
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase ${tone.badge}`}
          >
            {text(section.content, "eyebrow", variantLabel(variant))}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-bold sm:text-6xl">
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
                <div
                  className={`rounded-md border p-4 ${tone.card}`}
                  key={index}
                >
                  <dt className="text-xs tracking-wide uppercase opacity-70">
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

export function FeaturedPropertiesSection({
  section,
  context,
}: PublicSectionProps) {
  const list = items(section.content);
  const variant = realEstateVariant(context);
  if (variant === "local_agency" || variant === "premium")
    return <EstateEditorialProperties section={section} context={context} />;

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
              <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-wide text-[var(--public-primary)] uppercase">
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
                <MapPin
                  className="size-4 text-[var(--public-primary)]"
                  aria-hidden="true"
                />
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

export function PropertyHighlightsSection({
  section,
  context,
}: PublicSectionProps) {
  const list = items(section.content);
  const variant = realEstateVariant(context);
  if (variant === "local_agency" || variant === "premium")
    return <EstateEditorialServices section={section} context={context} />;

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
              {recordText(
                item,
                ["description", "text"],
                "Detalhe partilhado pela equipa após o primeiro contacto.",
              )}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function PropertyValuationSection({
  section,
  context,
}: PublicSectionProps) {
  const variant = realEstateVariant(context);
  if (variant === "local_agency" || variant === "premium")
    return <EstateEditorialValuation section={section} context={context} />;

  return (
    <PublicBand id="valuation">
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-slate-900 via-[var(--public-primary)] to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[var(--public-accent)]/20 blur-3xl"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--public-accent)] uppercase backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--public-accent)]" />
              {text(section.content, "eyebrow", "Avaliação Gratuita")}
            </span>
            <h2 className="mt-4 max-w-3xl text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl">
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
            <span>
              {text(section.content, "ctaPrimary", "Pedir Avaliação Gratuita")}
            </span>
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
            title={text(
              section.content,
              "title",
              "Especialistas no Mercado de Bairro",
            )}
            description={text(
              section.content,
              "text",
              "Dados transparentes de procura e tempos médios de resposta para si.",
            )}
          />
          {proof.length ? (
            <dl className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {proof.map((item, index) => (
                <div
                  className="rounded-md border border-slate-200/80 bg-white p-5 shadow-md backdrop-blur-sm transition-all hover:border-slate-300 hover:shadow-lg"
                  key={index}
                >
                  <dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">
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
                      {itemText(
                        area,
                        "profile",
                        "Perfil da zona partilhado pela equipa local.",
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-600/20">
                    {itemText(area, "trend", "Alta Procura")}
                  </span>
                </div>
                <dl className="m-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Preço médio
                    </dt>
                    <dd className="mt-1 text-base font-black text-slate-900">
                      {itemText(area, "averagePrice", "Sob consulta")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Tempo médio
                    </dt>
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

export function RealEstateAgentsSection({
  section,
  context,
}: PublicSectionProps) {
  const agents = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="agents" className="py-16">
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Advisors para decisões premium",
          )}
          description={text(
            section.content,
            "text",
            "Uma equipa pequena e sénior para compradores exigentes, venda estratégica e investimento residencial.",
          )}
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
                    <p className="text-xs font-black tracking-widest text-[var(--public-primary)] uppercase">
                      {role}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {name}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      {itemText(agent, "bio", "")}
                    </p>
                    <div className="mt-6 grid gap-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-700">
                      {itemText(agent, "phone") ? (
                        <span>{itemText(agent, "phone")}</span>
                      ) : null}
                      {itemText(agent, "email") ? (
                        <span>{itemText(agent, "email")}</span>
                      ) : null}
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
        description={text(
          section.content,
          "text",
          "Equipa com conhecimento local para garantir proximidade e apoio constante.",
        )}
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
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md shadow-md ring-4 ring-slate-100">
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
                  <p className="mt-1 text-xs font-bold tracking-wider text-[var(--public-primary)] uppercase">
                    {role}
                  </p>
                </div>
              </div>

              <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {itemText(agent, "bio", "")}
              </p>

              <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-700">
                {itemText(agent, "phone") ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      Tel
                    </span>
                    <span>{itemText(agent, "phone")}</span>
                  </div>
                ) : null}
                {itemText(agent, "email") ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      @
                    </span>
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

export function RealEstateProcessSection({
  section,
  context,
}: PublicSectionProps) {
  const steps = items(section.content);
  const variant = realEstateVariant(context);

  if (variant === "premium") {
    return (
      <PublicBand id="process" className="py-16">
        <div className="rounded-md bg-[#f4f1ec] p-6 ring-1 ring-slate-900/5 sm:p-10">
          <SectionHeading
            title={text(
              section.content,
              "title",
              "Processo de venda orientado por dados",
            )}
            description={text(
              section.content,
              "text",
              "Uma sequência clara para proteger valor, preparar visitas e acompanhar cada etapa com discrição.",
            )}
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                className="group relative overflow-hidden rounded-md bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                key={index}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
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
        title={text(
          section.content,
          "title",
          "Processo simples e transparente",
        )}
        description={text(
          section.content,
          "text",
          "Passo a passo pensado para eliminar incertezas.",
        )}
      />
      <div className="relative mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-sm font-semibold text-white/60 uppercase">
              {text(section.content, "eyebrow", "Private advisory")}
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-bold">
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
                  {itemText(
                    item,
                    "description",
                    "Detalhe partilhado pela equipa após o primeiro contacto.",
                  )}
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
      <article className="group overflow-hidden rounded-3xl border border-black/5 bg-white text-slate-950 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
        <PropertyImage property={property} priority />
        <div className="p-7">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--public-primary)]/10 px-3 py-1 text-xs font-bold tracking-wider text-[var(--public-primary)] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--public-primary)]" />
              {itemText(property, "tag", "Imóvel Curado")}
            </span>
            <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
              {itemText(property, "status", "Exclusivo")}
            </span>
          </div>
          <h3 className="mt-4 text-2xl leading-snug font-black tracking-tight text-slate-900">
            {itemText(property, "title", "Imovel selecionado")}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {itemText(
              property,
              "description",
              itemText(property, "location", ""),
            )}
          </p>

          <PropertyMeta property={property} />

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Preço de Guia
              </span>
              <p className="text-2xl font-black text-[var(--public-primary)]">
                {itemText(property, "price", "Preço sob consulta")}
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--public-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-[var(--public-primary)]/20 shadow-md transition-all duration-200 hover:shadow-[var(--public-primary)]/30 hover:shadow-lg"
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
      <div className="overflow-hidden rounded-md">
        <PropertyImage property={property} priority />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {itemText(property, "tag", "Destaque da Semana")}
          </span>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {itemText(property, "location", "Lisboa")}
          </span>
        </div>
        <h3 className="mt-3.5 text-xl font-black tracking-tight text-slate-900">
          {itemText(property, "title", "Imóvel Selecionado")}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
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
        <span>
          {beds} {beds !== "-" ? "Quartos" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Bath className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--public-primary)]" />
        <span>
          {baths} {baths !== "-" ? "Banhos" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Maximize2 className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--public-primary)]" />
        <span>{area}</span>
      </div>
    </div>
  );
}

function PropertyMetaClassic({
  property,
}: {
  property: Record<string, unknown>;
}) {
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
          <dd className="mt-1 font-semibold">{itemText(property, key, "-")}</dd>
        </div>
      ))}
    </dl>
  );
}
