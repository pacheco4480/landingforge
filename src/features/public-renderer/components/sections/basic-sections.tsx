import Image from "next/image";

import type { PublicSectionProps } from "@/features/public-renderer/types";
import { itemText, items, text } from "@/features/public-renderer/components/section-utils";

export function HeroSection({ section, context }: PublicSectionProps) {
  const c = section.content;
  return (
    <PublicBand className="pt-16 sm:pt-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--public-primary)]">
            {text(c, "eyebrow", context.site.businessName)}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            {text(c, "headline", text(c, "title", context.page.title))}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--public-muted)]">
            {text(c, "subheadline", text(c, "description", context.site.businessType))}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="public-button-primary" href="#contact">
              {text(c, "ctaPrimary", "Contactar")}
            </a>
            <a className="public-button-outline" href="#services">
              {text(c, "ctaSecondary", "Saber mais")}
            </a>
          </div>
        </div>
        <div className="rounded-md bg-[var(--public-surface)] p-6 shadow-sm">
          <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-[var(--public-primary)] via-[var(--public-secondary)] to-[var(--public-accent)] opacity-90" />
        </div>
      </div>
    </PublicBand>
  );
}

export function CardsSection({ section }: PublicSectionProps) {
  const list = items(section.content);
  return (
    <PublicBand id={section.sectionType}>
      <SectionHeading
        title={text(section.content, "title", section.name)}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(list.length ? list : [{ title: section.name, description: "A equipa partilha mais detalhes após o primeiro contacto." }]).map((item, index) => {
          const image = itemText(item, "image");
          const imagePosition = itemText(item, "imagePosition", "center");
          const title = itemText(item, "title", itemText(item, "name", "Item"));

          return (
          <article className="public-card overflow-hidden" key={index}>
            {image ? (
              <div className="-mx-6 -mt-6 mb-5">
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--public-surface)]">
                  <Image
                    alt={itemText(item, "imageAlt", title)}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    src={image}
                    style={{ objectPosition: imagePosition }}
                    unoptimized
                  />
                </div>
              </div>
            ) : null}
            <h3 className="text-lg font-semibold">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "description", itemText(item, "text", itemText(item, "quote", "")))}
            </p>
          </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function FaqSection({ section }: PublicSectionProps) {
  const list = items(section.content);
  return (
    <PublicBand id="faq">
      <SectionHeading title={text(section.content, "title", section.name)} />
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        {list.map((item, index) => (
          <details className="public-card" key={index}>
            <summary className="cursor-pointer font-semibold">
              {itemText(item, "question", "Pergunta")}
            </summary>
            <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "answer", "Resposta")}
            </p>
          </details>
        ))}
      </div>
    </PublicBand>
  );
}

export function StatsSection({ section }: PublicSectionProps) {
  const list = items(section.content);
  return (
    <PublicBand id="stats">
      <SectionHeading
        title={text(section.content, "title", section.name)}
        description={text(section.content, "text")}
      />
      <div className="grid gap-4 md:grid-cols-4">
        {(list.length ? list : [{ value: "100%", label: section.name }]).map((item, index) => (
          <div className="public-card text-center" key={index}>
            <p className="text-3xl font-bold text-[var(--public-primary)]">
              {itemText(item, "value", "0")}
            </p>
            <p className="mt-2 text-sm text-[var(--public-muted)]">
              {itemText(item, "label", itemText(item, "title", "Metric"))}
            </p>
          </div>
        ))}
      </div>
    </PublicBand>
  );
}

export function CtaSection({ section }: PublicSectionProps) {
  return (
    <PublicBand id="cta">
      <div className="rounded-md bg-[var(--public-primary)] p-8 text-white sm:p-12">
        <h2 className="max-w-3xl text-3xl font-bold">
          {text(section.content, "headline", section.name)}
        </h2>
        <p className="mt-3 max-w-2xl text-white/80">
        {text(section.content, "text", "Dê o próximo passo com uma experiência clara, rápida e focada no contacto certo.")}
        </p>
        <a className="mt-6 inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-[var(--public-primary)]" href="#contact">
          {text(section.content, "ctaPrimary", "Contactar")}
        </a>
      </div>
    </PublicBand>
  );
}

export function MapSection({ section }: PublicSectionProps) {
  return (
    <PublicBand id="map">
      <SectionHeading title={text(section.content, "title", section.name)} />
      <div className="mt-6 min-h-64 rounded-md border border-dashed border-slate-300 bg-[var(--public-surface)] p-6 text-[var(--public-muted)]">
        {text(section.content, "address", "Morada partilhada após confirmação do contacto.")}
      </div>
    </PublicBand>
  );
}

export function VideoSection({ section }: PublicSectionProps) {
  return (
    <PublicBand id="video">
      <SectionHeading
        title={text(section.content, "title", section.name)}
        description={text(section.content, "text")}
      />
      <div className="mt-6 aspect-video rounded-md bg-slate-950" />
    </PublicBand>
  );
}

export function LegalSection({ section }: PublicSectionProps) {
  const list = items(section.content);
  return (
    <PublicBand>
      <article className="mx-auto max-w-3xl">
        <SectionHeading
          title={text(section.content, "title", section.name)}
          description={text(section.content, "text")}
        />
        <div className="mt-8 grid gap-5">
          {list.map((item, index) => (
            <section className="public-card" key={index}>
              <h3 className="text-lg font-semibold">
                {itemText(item, "title", "Informação")}
              </h3>
              <p className="mt-2 leading-7 text-[var(--public-muted)]">
                {itemText(item, "description", itemText(item, "text", ""))}
              </p>
            </section>
          ))}
        </div>
      </article>
    </PublicBand>
  );
}

export function PublicBand({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={className} id={id}>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold leading-tight">{title}</h2>
      {description ? (
        <p className="mt-3 leading-7 text-[var(--public-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
