import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";
import type { ReactNode } from "react";

import { PublicBand, SectionHeading } from "@/features/public-renderer/components/sections/basic-sections";
import { isRecord, itemText, items, text } from "@/features/public-renderer/components/section-utils";
import type { PublicSectionProps } from "@/features/public-renderer/types";

function brandText(content: unknown, key: string, fallback: string) {
  if (!isRecord(content) || !isRecord(content.brandKit)) return fallback;
  const value = content.brandKit[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function media(item: Record<string, unknown>, fallback: string) {
  return itemText(item, "image", fallback);
}

export function LuxuryClinicHero({ context, section }: PublicSectionProps) {
  const image = text(section.content, "heroImage");
  return (
    <section className="clinic-luxury-hero" data-clinic-luxury-reveal>
      {image ? <Image src={image} alt={text(section.content, "heroImageAlt", text(section.content, "headline", context.page.title))} fill priority sizes="100vw" className="object-cover" unoptimized /> : null}
      <div className="clinic-luxury-hero__veil" />
      <div className="clinic-luxury-hero__content">
        <p className="clinic-luxury-kicker"><span />{text(section.content, "eyebrow", "Aurea Prive · cuidado privado")}</p>
        <h1>{text(section.content, "headline", context.page.title)}</h1>
        <p className="clinic-luxury-hero__lead">{text(section.content, "subheadline", "Um acompanhamento próximo, num espaço que respeita o seu tempo e a sua privacidade.")}</p>
        <div className="clinic-luxury-hero__actions">
          <a className="clinic-luxury-button clinic-luxury-button--gold" href="#booking">{text(section.content, "ctaPrimary", "Solicitar contacto")} <ArrowUpRight aria-hidden="true" /></a>
          <a className="clinic-luxury-text-link" href="#private-experience">{text(section.content, "ctaSecondary", "Conhecer o espaço")} <span>↓</span></a>
        </div>
        <p className="clinic-luxury-hero__promise">{brandText(section.content, "corePromise", "Tempo para ouvir. Cuidado para acompanhar.")}</p>
      </div>
    </section>
  );
}

export function LuxuryClinicExperience({ section }: PublicSectionProps) {
  const entries = items(section.content);
  return (
    <PublicBand id="private-experience" className="clinic-luxury-paper">
      <div className="clinic-luxury-intro" data-clinic-luxury-reveal>
        <p className="clinic-luxury-kicker clinic-luxury-kicker--dark"><span />Experiência privada</p>
        <SectionHeading title={text(section.content, "title", "Um espaço para abrandar o ritmo")} description={text(section.content, "text", "Cada detalhe foi pensado para que a consulta comece com confiança, clareza e tempo para ouvir.")} />
      </div>
      <div className="clinic-luxury-experience-grid">
        {entries.slice(0, 2).map((entry, index) => (
          <article className={`clinic-luxury-experience-card ${index === 1 ? "clinic-luxury-experience-card--offset" : ""}`} data-clinic-luxury-reveal key={index}>
            <div className="clinic-luxury-image-frame"><Image src={media(entry, "")} alt={itemText(entry, "imageAlt", itemText(entry, "title", "Espaço privado"))} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" unoptimized /></div>
            <div><p className="clinic-luxury-index">0{index + 1}</p><h3>{itemText(entry, "title", itemText(entry, "name", "Cuidado com intenção"))}</h3><p>{itemText(entry, "description", "Um ambiente reservado para conversar com serenidade e avançar com informação clara.")}</p></div>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function LuxuryClinicSpecialties({ section }: PublicSectionProps) {
  return <PublicBand className="clinic-luxury-paper"><div className="clinic-luxury-section-head" data-clinic-luxury-reveal><SectionHeading title={text(section.content, "title", "Áreas de cuidado") } description={text(section.content, "text", "Orientação especializada, explicada com rigor e sem promessas absolutas.")} /></div><div className="clinic-luxury-list">{items(section.content).map((item, index) => <article data-clinic-luxury-reveal key={index}><span>0{index + 1}</span><h3>{itemText(item, "name", itemText(item, "title", "Área de cuidado"))}</h3><p>{itemText(item, "description", "Uma conversa inicial ajuda a perceber o percurso mais adequado.")}</p><ArrowUpRight aria-hidden="true" /></article>)}</div></PublicBand>;
}

export function LuxuryClinicDoctors({ section }: PublicSectionProps) {
  return <PublicBand className="clinic-luxury-ink"><SectionHeading title={text(section.content, "title", "Pessoas que cuidam com tempo")} description={text(section.content, "text", "Uma equipa identificada, discreta e preparada para acompanhar cada etapa.")} /><div className="clinic-luxury-doctors">{items(section.content).map((item, index) => <article data-clinic-luxury-reveal key={index}><div className="clinic-luxury-portrait"><Image src={media(item, "")} alt={itemText(item, "imageAlt", itemText(item, "name", "Profissional de saúde"))} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" style={{ objectPosition: itemText(item, "imagePosition", "center") }} unoptimized /></div><p className="clinic-luxury-kicker">{itemText(item, "specialty", itemText(item, "role", "Acompanhamento clínico"))}</p><h3>{itemText(item, "name", "Profissional de saúde")}</h3><p className="clinic-luxury-doctor-copy">{itemText(item, "bio", "Orientação clara, escuta atenta e acompanhamento responsável.")}</p></article>)}</div></PublicBand>;
}

export function LuxuryClinicFacilities({ section }: PublicSectionProps) {
  return <PublicBand className="clinic-luxury-paper"><SectionHeading title={text(section.content, "title", "O espaço, sem ruído")} description={text(section.content, "text", "Luz natural, privacidade e orientação prática para chegar com tranquilidade.")} /><div className="clinic-luxury-facilities">{items(section.content).map((item, index) => <article data-clinic-luxury-reveal key={index}><div className="clinic-luxury-image-frame"><Image src={media(item, "")} alt={itemText(item, "imageAlt", itemText(item, "title", "Espaço da clínica"))} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" unoptimized /></div><h3>{itemText(item, "title", "Espaço privado")}</h3><p>{itemText(item, "description", "Um ambiente preparado para uma experiência calma e cuidada.")}</p></article>)}</div></PublicBand>;
}

export function LuxuryClinicJourney({ section }: PublicSectionProps) {
  return <PublicBand className="clinic-luxury-journey"><div className="clinic-luxury-section-head"><p className="clinic-luxury-kicker clinic-luxury-kicker--dark"><span />Um percurso previsível</p><SectionHeading title={text(section.content, "title", "Do primeiro contacto ao acompanhamento")} description={text(section.content, "text", "A equipa explica cada passo para que possa decidir com informação e sem pressa.")} /></div><ol>{items(section.content).map((item, index) => <li data-clinic-luxury-reveal key={index}><span>{index + 1}</span><div><h3>{itemText(item, "title", "Próximo passo")}</h3><p>{itemText(item, "description", "A equipa confirma o pedido e esclarece o que acontece a seguir.")}</p></div><Check aria-hidden="true" /></li>)}</ol></PublicBand>;
}

export function ClinicLuxuryReveal({ children }: { children: ReactNode }) { return <div className="clinic-luxury-experience">{children}</div>; }
