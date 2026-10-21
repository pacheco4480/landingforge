import Image from "next/image";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import { recordArray, realEstateVariant } from "./real-estate-utils";
import { EstateRail } from "./estate-motion";
import styles from "./estate-editorial.module.css";

export function EstateEditorialHero({ section, context }: PublicSectionProps) {
  const premium = realEstateVariant(context) === "premium";
  const c = section.content;
  const property = recordArray(c, "properties")[0] ?? {};
  const image = text(c, "heroImage", itemText(property, "image"));
  const stats = recordArray(c, "stats");
  return (
    <>
      <section
        id="hero"
        className={`${styles.hero} ${premium ? styles.premiumHero : styles.localHero}`}
      >
        {image && (
          <Image
            src={image}
            alt={text(
              c,
              "heroImageAlt",
              itemText(property, "imageAlt", itemText(property, "title", "")),
            )}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
            unoptimized
          />
        )}
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            {text(c, "eyebrow", context.page.title)}
          </p>
          <h1>{text(c, "headline", context.page.title)}</h1>
          <p className={styles.intro}>{text(c, "subheadline")}</p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href={premium ? "#contact" : "#valuation"}
            >
              {text(c, "ctaPrimary", "Pedir avaliação")}
              <ArrowUpRight aria-hidden="true" size={20} />
            </a>
            <a className={styles.secondary} href="#featured-properties">
              {text(c, "ctaSecondary", "Ver imóveis")}
              <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
        {itemText(property, "title") && (
          <a className={styles.heroCaption} href="#featured-properties">
            <MapPin aria-hidden="true" size={18} />
            <span>
              <small>{itemText(property, "location")}</small>
              {itemText(property, "title")}
            </span>
            <ArrowUpRight aria-hidden="true" size={22} />
          </a>
        )}
        <span className={styles.index} aria-hidden="true">
          01 / {premium ? "SELEÇÃO PRIVADA" : "VIVER O BAIRRO"}
        </span>
      </section>
      {stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index}>
              <dd>{itemText(stat, "value")}</dd>
              <dt>{itemText(stat, "label")}</dt>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

export function EstateEditorialProperties({
  section,
  context,
}: PublicSectionProps) {
  const premium = realEstateVariant(context) === "premium";
  const list = items(section.content);
  const cards = list.map((property, index) => (
    <article className={styles.property} key={index}>
      <a
        href="#contact"
        className={styles.propertyImage}
        aria-label={`Pedir informações: ${itemText(property, "title", "imóvel")}`}
      >
        {itemText(property, "image") && (
          <Image
            src={itemText(property, "image")}
            alt={itemText(property, "imageAlt", itemText(property, "title"))}
            fill
            sizes={
              premium
                ? "(min-width: 900px) 60vw, 85vw"
                : "(min-width: 900px) 50vw, 100vw"
            }
            unoptimized
          />
        )}
        <span className={styles.propertyNumber}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={styles.imageArrow}>
          <ArrowUpRight aria-hidden="true" size={26} />
        </span>
      </a>
      <div className={styles.propertyInfo}>
        <p className={styles.eyebrow}>
          {itemText(property, "status")} / {itemText(property, "type")}
        </p>
        <h3>{itemText(property, "title", "Imóvel selecionado")}</h3>
        <p>{itemText(property, "location")}</p>
        <dl className={styles.propertyMeta}>
          {[
            ["beds", "Quartos"],
            ["baths", "Casas de banho"],
            ["area", "Área"],
          ].map(([key, label]) =>
            itemText(property, key) && itemText(property, key) !== "-" ? (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{itemText(property, key)}</dd>
              </div>
            ) : null,
          )}
        </dl>
        <div className={styles.propertyBottom}>
          <strong>{itemText(property, "price", "Preço sob consulta")}</strong>
          <a href="#contact">
            {premium ? "Pedir dossier" : "Agendar visita"}
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>
        </div>
      </div>
    </article>
  ));
  return (
    <section id="featured-properties" className={styles.collection}>
      <div className={styles.sectionHead}>
        <span className={styles.chapter}>
          {premium ? "A coleção" : "O próximo capítulo"}
        </span>
        <h2>{text(section.content, "title", "Casas selecionadas")}</h2>
        <p>{text(section.content, "text")}</p>
      </div>
      {list.length === 0 ? (
        <p>
          Estamos a preparar uma nova seleção de imóveis. Fale connosco sobre o
          que procura.
        </p>
      ) : premium ? (
        <EstateRail label="Explorar a seleção de imóveis">{cards}</EstateRail>
      ) : (
        <div className={styles.localCollection}>{cards}</div>
      )}
    </section>
  );
}

export function EstateEditorialServices({
  section,
  context,
}: PublicSectionProps) {
  const premium = realEstateVariant(context) === "premium";
  return (
    <section id="services" className={styles.services}>
      <div className={styles.sectionHead}>
        <span className={styles.chapter}>
          {premium ? "Perspetiva e método" : "Sempre ao seu lado"}
        </span>
        <h2>{text(section.content, "title", "Acompanhamento imobiliário")}</h2>
        <p>{text(section.content, "text")}</p>
      </div>
      <div className={styles.serviceList}>
        {items(section.content).map((item, index) => (
          <article key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{itemText(item, "title", itemText(item, "name"))}</h3>
            <p>{itemText(item, "description", itemText(item, "text"))}</p>
            <ArrowUpRight aria-hidden="true" size={24} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function EstateEditorialValuation({ section }: PublicSectionProps) {
  return (
    <section id="valuation" className={styles.valuation}>
      <div data-estate-reveal>
        <p className={styles.eyebrow}>
          {text(section.content, "eyebrow", "Um novo começo")}
        </p>
        <h2>
          {text(
            section.content,
            "headline",
            "Qual é o próximo capítulo da sua casa?",
          )}
        </h2>
        <p>{text(section.content, "text")}</p>
        <a className={styles.primary} href="#contact">
          {text(section.content, "ctaPrimary", "Pedir avaliação")}
          <ArrowUpRight aria-hidden="true" size={22} />
        </a>
      </div>
      <span className={styles.valuationMark} aria-hidden="true">
        ↗
      </span>
    </section>
  );
}
