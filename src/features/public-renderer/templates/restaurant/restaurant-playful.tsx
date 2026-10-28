import Image from "next/image";
import { ArrowDown, ArrowUpRight, Utensils } from "lucide-react";

import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import {
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import { ContactSection } from "@/features/public-renderer/components/sections/contact-section";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import { recordArray } from "@/features/public-renderer/templates/restaurant/restaurant-utils";

function Sticker({
  asset,
  className = "",
  label,
}: {
  asset: string;
  className?: string;
  label: string;
}) {
  return (
    <span className={`restaurant-playful-sticker ${className}`}>
      <Image alt="" aria-hidden="true" height={54} src={asset} width={54} />
      <span>{label}</span>
    </span>
  );
}

export function PlayfulRestaurantHero({
  context,
  heroImage,
  heroImageAlt,
  highlights,
  section,
}: {
  context: PublicSectionProps["context"];
  heroImage: string;
  heroImageAlt: string;
  highlights: Record<string, unknown>[];
  section: PublicSectionProps["section"];
}) {
  const secondaryImage = text(section.content, "secondaryImage");

  return (
    <PublicBand className="restaurant-playful-hero" id="top">
      <div className="restaurant-playful-hero__frame">
        {heroImage ? (
          <Image
            alt={heroImageAlt}
            className="restaurant-playful-hero__photo"
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            src={heroImage}
            unoptimized
          />
        ) : null}
        <div aria-hidden="true" className="restaurant-playful-hero__veil" />
        <div className="restaurant-playful-hero__topline">
          <span>{text(section.content, "eyebrow", "Boca Pop")}</span>
          <span>Lisboa · mesa para partilhar</span>
        </div>
        <div className="restaurant-playful-hero__copy">
          <p className="restaurant-playful-kicker">
            Comida viva. Boa companhia.
          </p>
          <h1>{text(section.content, "headline", context.page.title)}</h1>
          <p className="restaurant-playful-hero__lead">
            {text(
              section.content,
              "subheadline",
              "Junta o grupo, escolhe pratos para partilhar e reserva uma mesa cheia de cor, cocktails e boa energia.",
            )}
          </p>
          <div className="restaurant-playful-actions">
            <a className="restaurant-playful-button" href="#reservation">
              {text(section.content, "ctaPrimary", "Reservar grupo")}
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="restaurant-playful-text-link" href="#menu">
              {text(section.content, "ctaSecondary", "Ver favoritos")}
              <ArrowDown aria-hidden="true" />
            </a>
          </div>
        </div>
        {secondaryImage ? (
          <figure className="restaurant-playful-hero__dish">
            <Image
              alt={text(
                section.content,
                "secondaryImageAlt",
                "Prato da casa do Boca Pop",
              )}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 240px, 30vw"
              src={secondaryImage}
              unoptimized
            />
            <figcaption>Para pôr no centro</figcaption>
          </figure>
        ) : null}
        <Sticker
          asset="/assets/restaurant/boca-pop/sticker-plate.svg"
          className="restaurant-playful-hero__sticker-plate"
          label="Partilha primeiro"
        />
        <Sticker
          asset="/assets/restaurant/boca-pop/sticker-glass.svg"
          className="restaurant-playful-hero__sticker-glass"
          label="Brinda depois"
        />
        <span aria-hidden="true" className="restaurant-playful-hero__burst" />
      </div>
      {highlights.length ? (
        <dl
          className="restaurant-playful-facts"
          aria-label="Informações do restaurante"
        >
          {highlights.map((item, index) => (
            <div key={index}>
              <dt>{itemText(item, "label", "Informação")}</dt>
              <dd>{itemText(item, "value", "")}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div
        aria-label="Boca Pop: comida para partilhar em Lisboa"
        className="restaurant-playful-marquee"
      >
        <span>Petiscos no centro</span>
        <i />
        <span>Cocktails da casa</span>
        <i />
        <span>Noites em grupo</span>
        <i />
        <span>Petiscos no centro</span>
      </div>
    </PublicBand>
  );
}

export function PlayfulMenuHighlights({ section }: PublicSectionProps) {
  const list = items(section.content);

  return (
    <PublicBand className="restaurant-playful-menu" id="menu">
      <div className="restaurant-playful-section-head">
        <p className="restaurant-playful-kicker">
          A carta · feita para o centro da mesa
        </p>
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Favoritos que chegam ao centro.",
          )}
          description={text(section.content, "text")}
        />
      </div>
      <div className="restaurant-playful-menu__list">
        {list.map((item, index) => (
          <article key={index}>
            <span className="restaurant-playful-menu__index">0{index + 1}</span>
            <div>
              <p>{itemText(item, "category", "Da carta")}</p>
              <h3>
                {itemText(
                  item,
                  "title",
                  itemText(item, "name", "Sugestão da casa"),
                )}
              </h3>
              <span>{itemText(item, "description", "")}</span>
            </div>
            {itemText(item, "price") ? (
              <strong>{itemText(item, "price")}</strong>
            ) : null}
          </article>
        ))}
        {!list.length ? (
          <p className="restaurant-playful-menu__empty">
            A carta está a ser preparada pela equipa.
          </p>
        ) : null}
      </div>
      <span aria-hidden="true" className="restaurant-playful-menu__stamp">
        Escolhido
        <br />à mesa
      </span>
    </PublicBand>
  );
}

export function PlayfulSignatureDishes({ section }: PublicSectionProps) {
  const dishes = items(section.content);
  const [featured, ...others] = dishes;

  return (
    <PublicBand className="restaurant-playful-dishes" id="signature-dishes">
      <div className="restaurant-playful-dishes__heading">
        <p className="restaurant-playful-kicker">O que sai da cozinha</p>
        <SectionHeading
          title={text(section.content, "title", "O que faz a mesa dizer sim")}
          description={text(section.content, "text")}
        />
        <Sticker
          asset="/assets/restaurant/boca-pop/sticker-sharing.svg"
          label="Pede para dividir"
        />
      </div>
      {featured ? (
        <div className="restaurant-playful-dishes__feature">
          {itemText(featured, "image") ? (
            <div className="restaurant-playful-image restaurant-playful-dishes__feature-image">
              <Image
                alt={itemText(
                  featured,
                  "imageAlt",
                  itemText(featured, "title", "Prato de assinatura"),
                )}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 54vw, 100vw"
                src={itemText(featured, "image")}
                style={{
                  objectPosition: itemText(featured, "imagePosition", "center"),
                }}
                unoptimized
              />
            </div>
          ) : (
            <div className="restaurant-playful-dishes__image-fallback">
              <Utensils aria-hidden="true" />
            </div>
          )}
          <div className="restaurant-playful-dishes__feature-copy">
            <span>{itemText(featured, "label", "Em destaque")}</span>
            <h3>{itemText(featured, "title", "Sugestão da casa")}</h3>
            <p>{itemText(featured, "description", "")}</p>
            {itemText(featured, "price") ? (
              <strong>{itemText(featured, "price")}</strong>
            ) : null}
          </div>
        </div>
      ) : null}
      {others.length ? (
        <div className="restaurant-playful-dishes__others">
          {others.map((item, index) => (
            <article key={index}>
              {itemText(item, "image") ? (
                <div className="restaurant-playful-image">
                  <Image
                    alt={itemText(
                      item,
                      "imageAlt",
                      itemText(item, "title", "Prato da casa"),
                    )}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    fill
                    sizes="(min-width: 1024px) 31vw, 90vw"
                    src={itemText(item, "image")}
                    style={{
                      objectPosition: itemText(item, "imagePosition", "center"),
                    }}
                    unoptimized
                  />
                </div>
              ) : null}
              <div>
                <span>{itemText(item, "label", "Da provar")}</span>
                <h3>{itemText(item, "title", "Sugestão da casa")}</h3>
                <p>{itemText(item, "description", "")}</p>
                {itemText(item, "price") ? (
                  <strong>{itemText(item, "price")}</strong>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PublicBand>
  );
}

export function PlayfulExperience({ section }: PublicSectionProps) {
  const list = items(section.content);

  return (
    <PublicBand className="restaurant-playful-experience" id="experience">
      <div className="restaurant-playful-experience__intro">
        <p className="restaurant-playful-kicker">Da conversa à mesa</p>
        <h2>
          {text(
            section.content,
            "title",
            "Da mensagem no grupo à mesa marcada",
          )}
        </h2>
        <p>{text(section.content, "text")}</p>
      </div>
      <div className="restaurant-playful-experience__steps">
        {list.map((item, index) => (
          <article key={index}>
            <span>0{index + 1}</span>
            <h3>{itemText(item, "title", "O próximo passo")}</h3>
            <p>{itemText(item, "description", "")}</p>
          </article>
        ))}
      </div>
      <div className="restaurant-playful-experience__visual" aria-hidden="true">
        <span>JUNTA</span>
        <span>·</span>
        <span>PARTILHA</span>
        <span>·</span>
        <span>REPETE</span>
      </div>
    </PublicBand>
  );
}

export function PlayfulReviews({ section }: PublicSectionProps) {
  const list = items(section.content);
  const [featured, ...others] = list;

  return (
    <PublicBand className="restaurant-playful-reviews" id="reviews">
      <p className="restaurant-playful-kicker">À mesa, em boa companhia</p>
      <SectionHeading
        title={text(section.content, "title", "Quem veio trouxe amigos")}
        description={text(section.content, "text")}
      />
      <div className="restaurant-playful-reviews__layout">
        {featured ? (
          <blockquote className="restaurant-playful-reviews__featured">
            <span aria-hidden="true">“</span>
            <p>
              {itemText(
                featured,
                "quote",
                itemText(featured, "description", ""),
              )}
            </p>
            <footer>
              {itemText(featured, "image") ? (
                <Image
                  alt=""
                  aria-hidden="true"
                  className="object-cover"
                  height={56}
                  src={itemText(featured, "image")}
                  style={{
                    objectPosition: itemText(
                      featured,
                      "imagePosition",
                      "center",
                    ),
                  }}
                  unoptimized
                  width={56}
                />
              ) : null}
              <div>
                <strong>{itemText(featured, "name", "Cliente")}</strong>
                <span>{itemText(featured, "context", "Mesa de amigos")}</span>
              </div>
            </footer>
          </blockquote>
        ) : null}
        <div className="restaurant-playful-reviews__secondary">
          {others.map((item, index) => (
            <blockquote key={index}>
              <p>
                “{itemText(item, "quote", itemText(item, "description", ""))}”
              </p>
              <footer>
                {itemText(item, "image") ? (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="object-cover"
                    height={44}
                    src={itemText(item, "image")}
                    style={{
                      objectPosition: itemText(item, "imagePosition", "center"),
                    }}
                    unoptimized
                    width={44}
                  />
                ) : null}
                <div>
                  <strong>{itemText(item, "name", "Cliente")}</strong>
                  <span>{itemText(item, "context", "Mesa de amigos")}</span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function PlayfulGallery({ section }: PublicSectionProps) {
  const list = items(section.content);

  return (
    <PublicBand className="restaurant-playful-gallery" id="gallery">
      <div className="restaurant-playful-gallery__heading">
        <p className="restaurant-playful-kicker">Vê o que te espera</p>
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Momentos que a mesa vai comentar",
          )}
          description={text(section.content, "text")}
        />
      </div>
      <div className="restaurant-playful-gallery__grid">
        {list.map((item, index) => (
          <figure
            className={`restaurant-playful-gallery__item restaurant-playful-gallery__item--${index % 4}`}
            key={index}
          >
            {itemText(item, "image") ? (
              <Image
                alt={itemText(
                  item,
                  "imageAlt",
                  itemText(item, "label", "Momento no Boca Pop"),
                )}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 35vw, (min-width: 640px) 48vw, 100vw"
                src={itemText(item, "image")}
                style={{
                  objectPosition: itemText(item, "imagePosition", "center"),
                }}
                unoptimized
              />
            ) : (
              <div
                aria-hidden="true"
                className="restaurant-playful-gallery__fallback"
              >
                <Utensils />
              </div>
            )}
            <figcaption>
              <span>{itemText(item, "label", "Da mesa")}</span>
              <p>
                {itemText(item, "description", itemText(item, "title", ""))}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </PublicBand>
  );
}

export function PlayfulReservation({ context, section }: PublicSectionProps) {
  const details = recordArray(section.content, "details");

  return (
    <>
      <PublicBand className="restaurant-playful-reservation" id="reservation">
        <div className="restaurant-playful-reservation__layout">
          <div>
            <p className="restaurant-playful-kicker">
              A próxima mesa começa aqui
            </p>
            <h2>
              {text(section.content, "title", "Junta a mesa antes que esgote.")}
            </h2>
            <p>{text(section.content, "text")}</p>
            <a href="#contact">
              {text(section.content, "ctaPrimary", "Pedir reserva")}{" "}
              <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <dl>
            {details.map((item, index) => (
              <div key={index}>
                <dt>{itemText(item, "label", "Informação")}</dt>
                <dd>{itemText(item, "value", "")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </PublicBand>
      <ContactSection
        context={context}
        description="Indica o dia, o horário e o tamanho do grupo. A equipa confirma a disponibilidade por email."
        section={section}
        title="Pede a tua reserva"
      />
    </>
  );
}

export function PlayfulLocation({
  address,
  mapQuery,
  section,
}: PublicSectionProps & { address: string; mapQuery: string }) {
  return (
    <PublicBand className="restaurant-playful-location" id="location">
      <div className="restaurant-playful-location__grid">
        <div>
          <p className="restaurant-playful-kicker">Chegar é simples</p>
          <SectionHeading
            title={text(
              section.content,
              "title",
              "Perto da noite, fácil de chegar",
            )}
            description={text(section.content, "text")}
          />
          <dl>
            <div>
              <dt>Morada</dt>
              <dd>{address}</dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>
                {text(
                  section.content,
                  "hours",
                  "Confirma o horário junto da equipa.",
                )}
              </dd>
            </div>
            <div>
              <dt>Reserva</dt>
              <dd>
                {text(
                  section.content,
                  "reservationNote",
                  "O pedido de reserva fica sujeito a confirmação da equipa.",
                )}
              </dd>
            </div>
          </dl>
        </div>
        {mapQuery ? (
          <a
            aria-label={`Abrir direções para ${address} no Google Maps`}
            className="restaurant-playful-location__map-note"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            rel="noreferrer"
            target="_blank"
          >
            <span className="restaurant-playful-location__map-icon">
              <Utensils aria-hidden="true" />
            </span>
            <span>
              <strong>O Boca Pop fica à tua espera</strong>
              <span>{address}</span>
              <span className="restaurant-playful-location__directions">
                Abrir direções no Google Maps <ArrowUpRight aria-hidden="true" />
              </span>
            </span>
          </a>
        ) : (
          <div className="restaurant-playful-location__map-note">
            {text(
              section.content,
              "mapNote",
              "A morada será partilhada pela equipa.",
            )}
          </div>
        )}
      </div>
    </PublicBand>
  );
}

export function RestaurantPlayfulReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="restaurant-playful">{children}</div>;
}
