import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Dumbbell,
  MoveUpRight,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import {
  FaqSection,
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { ContactSection } from "@/features/public-renderer/components/sections/contact-section";
import { itemText, items, text } from "@/features/public-renderer/components/section-utils";
import { gymSectionRegistry } from "@/features/public-renderer/section-registry/gym";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import { GymModernGalleryClient } from "@/features/public-renderer/templates/gym/gym-modern-gallery";

const fallbackImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=85";

function CmsImage({
  alt,
  className,
  position,
  sizes,
  src,
}: {
  alt: string;
  className: string;
  position?: string;
  sizes: string;
  src: string;
}) {
  return (
    <Image
      alt={alt}
      className={className}
      fill
      sizes={sizes}
      src={src}
      style={{ objectPosition: position ?? "center" }}
      unoptimized
    />
  );
}

export function GymModernHero({ context, section }: PublicSectionProps) {
  const content = section.content;
  return (
    <section className="gym-modern-hero" id="hero">
      <CmsImage
        alt={text(content, "heroImageAlt", "Atleta a treinar no Norte Studio")}
        className="gym-modern-hero__image"
        position={text(content, "heroImagePosition", "center 42%")}
        sizes="100vw"
        src={text(content, "heroImage", fallbackImage)}
      />
      <div aria-hidden="true" className="gym-modern-hero__shade" />
      <div className="gym-modern-hero__content">
        <p className="gym-modern-kicker">
          <Dumbbell aria-hidden="true" size={15} />
          {text(content, "eyebrow", "Norte Studio · Treino com método")}
        </p>
        <h1>{text(content, "headline", context.page.title)}</h1>
        <p className="gym-modern-hero__lead">
          {text(
            content,
            "subheadline",
            "Um estúdio de treino acompanhado, pensado para encaixar na tua vida e dar clareza a cada sessão.",
          )}
        </p>
        <div className="gym-modern-hero__actions">
          <a className="gym-modern-button" href="#trial">
            {text(content, "ctaPrimary", "Pedir avaliação")}
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>
          <a className="gym-modern-text-link" href="#method">
            {text(content, "ctaSecondary", "Explorar programas")}
            <ArrowDown aria-hidden="true" size={16} />
          </a>
        </div>
      </div>
      <p className="gym-modern-hero__index" aria-hidden="true">
        01 <span /> MOVIMENTO COM INTENÇÃO
      </p>
    </section>
  );
}

export function GymModernMethod({ section }: PublicSectionProps) {
  const content = section.content;
  const steps = items(content).length
    ? items(content).slice(0, 3)
    : [
        { title: "Avaliar", description: "Perceber o ponto de partida, sem julgamentos nem atalhos." },
        { title: "Construir", description: "Escolher um programa que respeita o teu tempo e a tua realidade." },
        { title: "Progredir", description: "Medir o que importa e ajustar o plano à medida que evoluis." },
      ];
  return (
    <PublicBand className="gym-modern-method" id="method">
      <div className="gym-modern-method__intro">
        <p className="gym-modern-kicker gym-modern-kicker--dark">NORTE STUDIO / MÉTODO</p>
        <SectionHeading
          title={text(content, "title", "Treinar melhor começa antes da primeira repetição.")}
          description={text(content, "text", "Cada pessoa chega com um ponto de partida diferente. O nosso trabalho é transformar esse ponto de partida num caminho claro.")}
          descriptionClassName="gym-modern-muted"
        />
      </div>
      <div className="gym-modern-method__visual">
        <CmsImage
          alt={text(content, "imageAlt", "Treinador a acompanhar uma sessão de treino")}
          className="gym-modern-method__image"
          sizes="(min-width: 1024px) 42vw, 100vw"
          src={text(content, "image", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=84")}
        />
        <span className="gym-modern-method__caption">AVALIAÇÃO · PLANO · ACOMPANHAMENTO</span>
      </div>
      <ol className="gym-modern-method__steps">
        {steps.map((step, index) => (
          <li className="gym-modern-method__step" key={index}>
            <span className="gym-modern-method__number">0{index + 1}</span>
            <div>
              <h3>{itemText(step, "title", "Etapa")}</h3>
              <p>{itemText(step, "description", "Um plano construído em conjunto.")}</p>
            </div>
            <Check aria-hidden="true" className="gym-modern-method__check" size={18} />
          </li>
        ))}
      </ol>
    </PublicBand>
  );
}

export function GymModernValuesRail({ section }: PublicSectionProps) {
  const values = items(section.content).length
    ? items(section.content)
    : [{ title: "Força" }, { title: "Movimento" }, { title: "Energia" }, { title: "Consistência" }];
  return (
    <section aria-label="Princípios de treino" className="gym-modern-values">
      <div className="gym-modern-values__inner">
        {values.map((item, index) => (
          <span key={index}>
            <i aria-hidden="true" />
            {itemText(item, "title", "MOVIMENTO")}
          </span>
        ))}
      </div>
    </section>
  );
}

export function GymModernSpace({ section }: PublicSectionProps) {
  const content = section.content;
  const gallery = items(content);
  return (
    <PublicBand className="gym-modern-space" id="space">
      <div className="gym-modern-section-head">
        <p className="gym-modern-kicker gym-modern-kicker--dark">POR DENTRO DO ESTÚDIO</p>
        <SectionHeading
          title={text(content, "title", "Um espaço desenhado para te pôr em movimento")}
          description={text(content, "text", "Equipamento, luz e espaço para treinar com foco.")}
          descriptionClassName="gym-modern-muted"
        />
      </div>
      <GymModernGalleryClient entries={gallery} />
    </PublicBand>
  );
}

export function GymModernPrograms({ section }: PublicSectionProps) {
  const content = section.content;
  const programs = items(content);
  return (
    <PublicBand className="gym-modern-programs" id="programs">
      <div className="gym-modern-section-head gym-modern-section-head--light">
        <p className="gym-modern-kicker">ENCONTRA O TEU PONTO DE PARTIDA</p>
        <SectionHeading
          title={text(content, "title", "O teu treino começa com um plano")}
          description={text(content, "text", "Conhece as opções e escolhe o acompanhamento que faz sentido para ti.")}
          descriptionClassName="gym-modern-light-muted"
        />
      </div>
      <div className="gym-modern-program-list">
        {programs.map((program, index) => {
          const title = itemText(program, "title", itemText(program, "name", "Programa"));
          const image = itemText(program, "image");
          return (
            <article className="gym-modern-program" key={index}>
              <div className="gym-modern-program__image-wrap">
                {image ? (
                  <CmsImage
                    alt={itemText(program, "imageAlt", title)}
                    className="gym-modern-program__image"
                    position={itemText(program, "imagePosition")}
                    sizes="(min-width: 900px) 36vw, 90vw"
                    src={image}
                  />
                ) : (
                  <div className="gym-modern-program__empty" aria-hidden="true"><Dumbbell size={32} /></div>
                )}
                <span className="gym-modern-program__number">0{index + 1}</span>
              </div>
              <div className="gym-modern-program__copy">
                <p>{itemText(program, "label", "PROGRAMA")}</p>
                <h3>{title}</h3>
                <span>{itemText(program, "description", "Acompanhamento adaptado ao teu ponto de partida.")}</span>
                <a href="#trial" aria-label={`Pedir informações sobre ${title}`}>
                  Saber mais <MoveUpRight aria-hidden="true" size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function GymModernBenefits({ section }: PublicSectionProps) {
  const content = section.content;
  const benefits = items(content).length
    ? items(content)
    : [
        { title: "Mais força", description: "Com técnica e progressão ajustadas ao teu ponto de partida." },
        { title: "Mais energia", description: "Com uma rotina de treino que respeita o teu ritmo." },
        { title: "Mais confiança", description: "Com acompanhamento próximo em cada etapa." },
      ];
  return (
    <PublicBand className="gym-modern-benefits" id="results">
      <p className="gym-modern-kicker gym-modern-kicker--dark">O QUE MUDA NO TEU DIA</p>
      <div className="gym-modern-benefits__layout">
        <SectionHeading
          title={text(content, "title", "Resultados que se sentem fora do ginásio")}
          description={text(content, "text", "Treinar com intenção pode ajudar-te a ganhar força, energia e confiança no dia a dia.")}
          descriptionClassName="gym-modern-muted"
        />
        <ul>
          {benefits.map((item, index) => (
            <li key={index}><span>0{index + 1}</span><strong>{itemText(item, "title", "Evolução")}</strong><p>{itemText(item, "description", "Com consistência e acompanhamento.")}</p></li>
          ))}
        </ul>
      </div>
    </PublicBand>
  );
}

export function GymModernSchedule({ section }: PublicSectionProps) {
  const content = section.content;
  return (
    <PublicBand className="gym-modern-schedule" id="schedule">
      <div className="gym-modern-section-head">
        <p className="gym-modern-kicker gym-modern-kicker--dark">A TUA SEMANA, EM MOVIMENTO</p>
        <SectionHeading title={text(content, "title", "Encontra o teu ritmo")} description={text(content, "text")} descriptionClassName="gym-modern-muted" />
      </div>
      <div className="gym-modern-schedule__rows">
        {items(content).map((slot, index) => (
          <div className="gym-modern-schedule__row" key={index}>
            <span>0{index + 1}</span><h3>{itemText(slot, "title", "Sessão")}</h3><p>{itemText(slot, "description", "Consulta os horários disponíveis.")}</p>
          </div>
        ))}
      </div>
    </PublicBand>
  );
}

export function GymModernPlans({ section }: PublicSectionProps) {
  const content = section.content;
  return (
    <PublicBand className="gym-modern-plans" id="plans">
      <div className="gym-modern-section-head gym-modern-section-head--light">
        <p className="gym-modern-kicker">FORMATOS DE ACOMPANHAMENTO</p>
        <SectionHeading title={text(content, "title", "Escolhe o nível de acompanhamento")} description={text(content, "text")} descriptionClassName="gym-modern-light-muted" />
      </div>
      <div className="gym-modern-plans__list">
        {items(content).map((plan, index) => (
          <article key={index}>
            <span>0{index + 1} / {itemText(plan, "label", "FORMATO")}</span>
            <h3>{itemText(plan, "title", "Acompanhamento")}</h3>
            <p>{itemText(plan, "description", "Conhece melhor este formato através de uma conversa com a equipa.")}</p>
            <a href="#trial">Pedir detalhes <ArrowUpRight aria-hidden="true" size={16} /></a>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function GymModernCoaches({ section }: PublicSectionProps) {
  const content = section.content;
  return (
    <PublicBand className="gym-modern-coaches" id="coaches">
      <div className="gym-modern-section-head">
        <p className="gym-modern-kicker gym-modern-kicker--dark">ACOMPANHAMENTO PRÓXIMO</p>
        <SectionHeading title={text(content, "title", "A experiência certa muda o treino")} description={text(content, "text")} descriptionClassName="gym-modern-muted" />
      </div>
      <div className="gym-modern-coaches__grid">
        {items(content).map((person, index) => {
          const name = itemText(person, "name", itemText(person, "title", "Equipa Norte"));
          const image = itemText(person, "image");
          return (
            <article key={index}>
              <div className="gym-modern-coach-image">
                {image ? <CmsImage alt={itemText(person, "imageAlt", name)} className="gym-modern-coach-image__photo" position={itemText(person, "imagePosition")} sizes="(min-width: 900px) 28vw, 80vw" src={image} /> : <div className="gym-modern-program__empty" aria-hidden="true"><Dumbbell size={32} /></div>}
                <span>0{index + 1}</span>
              </div>
              <h3>{name}</h3><p>{itemText(person, "role", itemText(person, "specialty", itemText(person, "title", itemText(person, "description", "Treino acompanhado"))))}</p>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function GymModernTrial({ section }: PublicSectionProps) {
  const content = section.content;
  return (
    <section className="gym-modern-trial" id="trial">
      <div className="gym-modern-trial__content">
        <p className="gym-modern-kicker">O PRIMEIRO PASSO É UMA CONVERSA</p>
        <h2>{text(content, "title", "Vem experimentar uma sessão com método.")}</h2>
        <p>{text(content, "text", "Partilha o teu ponto de partida e a equipa ajuda-te a perceber qual poderá ser o próximo passo.")}</p>
        <a className="gym-modern-button" href="#contact">{text(content, "cta", "Pedir avaliação")} <ArrowUpRight aria-hidden="true" size={18} /></a>
      </div>
      <div className="gym-modern-trial__mark" aria-hidden="true">N<span>↗</span></div>
    </section>
  );
}

export function GymModernContact(props: PublicSectionProps) {
  return <div className="gym-modern-contact"><ContactSection {...props} /></div>;
}

export function GymModernReveal({ children }: { children: ReactNode }) {
  return <div className="gym-modern">{children}</div>;
}

export const gymModernSectionRegistry: Record<string, ComponentType<PublicSectionProps>> = {
  ...gymSectionRegistry,
  gym_hero: GymModernHero,
  gym_method: GymModernMethod,
  gym_values_rail: GymModernValuesRail,
  gym_space: GymModernSpace,
  gym_schedule: GymModernSchedule,
  gym_benefits: GymModernBenefits,
  gym_programs: GymModernPrograms,
  gym_coaches: GymModernCoaches,
  gym_plans: GymModernPlans,
  gym_trial: GymModernTrial,
  gym_faq: FaqSection,
  gym_contact: GymModernContact,
};

