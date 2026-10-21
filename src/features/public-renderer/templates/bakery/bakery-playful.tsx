import Image from "next/image";
import {
  ArrowDownRight,
  ArrowUpRight,
  CakeSlice,
  Clock3,
  MapPin,
  Palette,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  FaqSection,
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { ContactSection } from "@/features/public-renderer/components/sections/contact-section";
import {
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import type { PublicSectionProps } from "@/features/public-renderer/types";

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

function ImageFallback({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="bakery-playful-image-fallback"
      role="img"
    >
      <CakeSlice aria-hidden="true" size={36} />
    </div>
  );
}

export function BakeryPlayfulHero({ context, section }: PublicSectionProps) {
  const content = section.content;
  const image = text(content, "heroImage");

  return (
    <section className="bakery-playful-hero" id="hero">
      <div className="bakery-playful-hero__frame">
        {image ? (
          <CmsImage
            alt={text(
              content,
              "heroImageAlt",
              "Bolo colorido decorado para uma celebração",
            )}
            className="bakery-playful-hero__image"
            sizes="100vw"
            src={image}
          />
        ) : (
          <ImageFallback label="Fotografia principal de um bolo da Boca Doce" />
        )}
        <div aria-hidden="true" className="bakery-playful-hero__veil" />
        <div className="bakery-playful-hero__masthead">
          <span>
            {text(content, "eyebrow", "Boca Doce · Pastelaria criativa")}
          </span>
          <span>
            Bolos e pastelaria <i aria-hidden="true">/</i> Feito para celebrar
          </span>
        </div>
        <div className="bakery-playful-hero__copy" data-bakery-reveal>
          <p className="bakery-playful-kicker">
            <Sparkles aria-hidden="true" size={15} />
            Uma montra cheia de cor
          </p>
          <h1>{text(content, "headline", context.page.title)}</h1>
          <p className="bakery-playful-hero__lead">
            {text(
              content,
              "subheadline",
              "Bolos personalizados, doces coloridos e encomendas feitas para transformar qualquer dia numa celebração.",
            )}
          </p>
          <div className="bakery-playful-hero__actions">
            <a className="bakery-playful-button" href="#custom-orders">
              {text(content, "ctaPrimary", "Criar o meu bolo")}
              <ArrowUpRight aria-hidden="true" size={18} />
            </a>
            <a className="bakery-playful-link" href="#products">
              {text(content, "ctaSecondary", "Ver os mais pedidos")}
              <ArrowDownRight aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
        <div aria-hidden="true" className="bakery-playful-hero__seal">
          <span aria-hidden="true" className="bakery-playful-hero__seal-art" />
        </div>
        <span aria-hidden="true" className="bakery-playful-hero__side-note">
          Uma fatia muda o dia.
        </span>
      </div>
      <div
        aria-label="Especialidades da Boca Doce"
        className="bakery-playful-ribbon"
      >
        <span>Bolos de celebração</span>
        <i aria-hidden="true" />
        <span>Pastelaria criativa</span>
        <i aria-hidden="true" />
        <span>Encomendas por medida</span>
      </div>
    </section>
  );
}

export function BakeryPlayfulProducts({ section }: PublicSectionProps) {
  const [featured, ...otherProducts] = items(section.content);

  return (
    <PublicBand className="bakery-playful-products" id="products">
      <div className="bakery-playful-products__heading" data-bakery-reveal>
        <p className="bakery-playful-kicker">Da montra para a tua mesa</p>
        <SectionHeading
          title={text(section.content, "title", "Os mais pedidos")}
          description={text(section.content, "text")}
        />
        <span aria-hidden="true" className="bakery-playful-products__sticker" />
      </div>
      {featured ? (
        <article className="bakery-playful-featured" data-bakery-reveal>
          <div className="bakery-playful-featured__image">
            {itemText(featured, "image") ? (
              <CmsImage
                alt={itemText(
                  featured,
                  "imageAlt",
                  itemText(featured, "title", "Doce da Boca Doce"),
                )}
                className="bakery-playful-photo"
                position={itemText(featured, "imagePosition", "center")}
                sizes="(min-width: 1024px) 58vw, 100vw"
                src={itemText(featured, "image")}
              />
            ) : (
              <ImageFallback
                label={itemText(featured, "title", "Doce da Boca Doce")}
              />
            )}
            <span className="bakery-playful-product-label">
              {itemText(featured, "label", "Feito na casa")}
            </span>
          </div>
          <div className="bakery-playful-featured__copy">
            <span className="bakery-playful-kicker">A escolha da montra</span>
            <h3>
              {itemText(
                featured,
                "title",
                itemText(featured, "name", "Criação da casa"),
              )}
            </h3>
            <p>
              {itemText(
                featured,
                "description",
                itemText(featured, "text", ""),
              )}
            </p>
            {itemText(featured, "price") ? (
              <strong>{itemText(featured, "price")}</strong>
            ) : null}
            <a href="#custom-orders">
              Pedir uma encomenda <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </article>
      ) : null}
      {otherProducts.length ? (
        <div className="bakery-playful-products__supporting">
          {otherProducts.map((product, index) => (
            <article
              className="bakery-playful-small-product"
              data-bakery-reveal
              key={`${itemText(product, "title", "produto")}-${index}`}
            >
              <div className="bakery-playful-small-product__image">
                {itemText(product, "image") ? (
                  <CmsImage
                    alt={itemText(
                      product,
                      "imageAlt",
                      itemText(product, "title", "Doce da Boca Doce"),
                    )}
                    className="bakery-playful-photo"
                    position={itemText(product, "imagePosition", "center")}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 44vw, 100vw"
                    src={itemText(product, "image")}
                  />
                ) : (
                  <ImageFallback
                    label={itemText(product, "title", "Doce da Boca Doce")}
                  />
                )}
              </div>
              <div className="bakery-playful-small-product__copy">
                <span>{itemText(product, "label", "Da montra")}</span>
                <h3>
                  {itemText(
                    product,
                    "title",
                    itemText(product, "name", "Doce da casa"),
                  )}
                </h3>
                <p>
                  {itemText(
                    product,
                    "description",
                    itemText(product, "text", ""),
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PublicBand>
  );
}

export function BakeryPlayfulStory({ section }: PublicSectionProps) {
  const steps = items(section.content);

  return (
    <PublicBand className="bakery-playful-story" id="story">
      <div className="bakery-playful-story__intro" data-bakery-reveal>
        <p className="bakery-playful-kicker">
          Da primeira ideia ao último detalhe
        </p>
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Uma pequena fábrica de grandes momentos",
          )}
          description={text(section.content, "text")}
        />
      </div>
      {steps.length ? (
        <ol className="bakery-playful-story__steps">
          {steps.map((step, index) => (
            <li
              data-bakery-reveal
              key={`${itemText(step, "title", "passo")}-${index}`}
            >
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <h3>{itemText(step, "title", "O próximo passo")}</h3>
                <p>
                  {itemText(step, "description", itemText(step, "text", ""))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <span aria-hidden="true" className="bakery-playful-story__pattern" />
    </PublicBand>
  );
}

export function BakeryPlayfulCelebration({ section }: PublicSectionProps) {
  const occasions = items(section.content);
  const icons = [PartyPopper, CakeSlice, Palette];

  return (
    <PublicBand className="bakery-playful-celebration" id="celebration">
      <div className="bakery-playful-celebration__heading" data-bakery-reveal>
        <p className="bakery-playful-kicker">Uma ocasião, um doce à altura</p>
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Que sabor tem a tua celebração?",
          )}
          description={text(section.content, "text")}
        />
      </div>
      <div className="bakery-playful-occasions">
        {occasions.map((occasion, index) => {
          const Icon = icons[index % icons.length];
          return (
            <article
              data-bakery-reveal
              key={`${itemText(occasion, "title", "ocasião")}-${index}`}
            >
              <span className="bakery-playful-occasion-icon">
                <Icon aria-hidden="true" size={27} />
              </span>
              <span className="bakery-playful-occasion-index">
                0{index + 1}
              </span>
              <h3>{itemText(occasion, "title", "Um momento especial")}</h3>
              <p>
                {itemText(
                  occasion,
                  "description",
                  itemText(occasion, "text", ""),
                )}
              </p>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function BakeryPlayfulGallery({ section }: PublicSectionProps) {
  const photos = items(section.content);

  return (
    <PublicBand className="bakery-playful-gallery" id="gallery">
      <div className="bakery-playful-gallery__heading" data-bakery-reveal>
        <p className="bakery-playful-kicker">Um olhar sobre a montra</p>
        <SectionHeading
          title={text(section.content, "title", "Visto na mesa")}
          description={text(section.content, "text")}
        />
      </div>
      <div className="bakery-playful-gallery__grid">
        {photos.map((photo, index) => (
          <figure
            className={`bakery-playful-gallery__item bakery-playful-gallery__item--${index % 3}`}
            data-bakery-reveal
            key={`${itemText(photo, "title", "fotografia")}-${index}`}
          >
            <div className="bakery-playful-gallery__photo">
              {itemText(photo, "image") ? (
                <CmsImage
                  alt={itemText(
                    photo,
                    "imageAlt",
                    itemText(photo, "title", "Doce da Boca Doce"),
                  )}
                  className="bakery-playful-photo"
                  position={itemText(photo, "imagePosition", "center")}
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                  src={itemText(photo, "image")}
                />
              ) : (
                <ImageFallback
                  label={itemText(photo, "title", "Fotografia da montra")}
                />
              )}
            </div>
            <figcaption>
              <span>{itemText(photo, "label", "Boca Doce")}</span>
              <strong>{itemText(photo, "title", "Da montra")}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
    </PublicBand>
  );
}

export function BakeryPlayfulTestimonials({ section }: PublicSectionProps) {
  const testimonials = items(section.content);

  return (
    <PublicBand className="bakery-playful-testimonials" id="testimonials">
      <div className="bakery-playful-testimonials__heading" data-bakery-reveal>
        <p className="bakery-playful-kicker">Palavras doces, sem exageros</p>
        <SectionHeading
          title={text(section.content, "title", "Quem provou, voltou")}
          description={text(section.content, "text")}
        />
      </div>
      <div className="bakery-playful-testimonials__list">
        {testimonials.map((testimonial, index) => (
          <figure
            data-bakery-reveal
            key={`${itemText(testimonial, "name", "cliente")}-${index}`}
          >
            <span aria-hidden="true">“</span>
            <blockquote>
              {itemText(
                testimonial,
                "quote",
                itemText(testimonial, "description", ""),
              )}
            </blockquote>
            <figcaption>{itemText(testimonial, "name", "Cliente")}</figcaption>
          </figure>
        ))}
      </div>
    </PublicBand>
  );
}

export function BakeryPlayfulSeasonal({ section }: PublicSectionProps) {
  const [featured, ...otherOffers] = items(section.content);

  return (
    <PublicBand className="bakery-playful-seasonal" id="seasonal-offers">
      <div className="bakery-playful-seasonal__panel" data-bakery-reveal>
        <div className="bakery-playful-seasonal__copy">
          <p className="bakery-playful-kicker">Novidade na montra</p>
          <h2>{text(section.content, "title", "A edição desta semana")}</h2>
          <p>{text(section.content, "text")}</p>
          {featured ? (
            <>
              <h3>
                {itemText(
                  featured,
                  "title",
                  itemText(featured, "name", "Edição da semana"),
                )}
              </h3>
              <p>
                {itemText(
                  featured,
                  "description",
                  itemText(featured, "text", ""),
                )}
              </p>
              {itemText(featured, "label") ? (
                <span className="bakery-playful-seasonal__label">
                  {itemText(featured, "label")}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
        {featured && itemText(featured, "image") ? (
          <div className="bakery-playful-seasonal__image">
            <CmsImage
              alt={itemText(
                featured,
                "imageAlt",
                itemText(featured, "title", "Doce sazonal da Boca Doce"),
              )}
              className="bakery-playful-photo"
              position={itemText(featured, "imagePosition", "center")}
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={itemText(featured, "image")}
            />
          </div>
        ) : null}
      </div>
      {otherOffers.length ? (
        <ul className="bakery-playful-seasonal__extras">
          {otherOffers.map((offer, index) => (
            <li key={`${itemText(offer, "title", "edição")}-${index}`}>
              <span>{itemText(offer, "label", "Da montra")}</span>
              <strong>
                {itemText(
                  offer,
                  "title",
                  itemText(offer, "name", "Edição sazonal"),
                )}
              </strong>
              <span>
                {itemText(offer, "description", itemText(offer, "text", ""))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </PublicBand>
  );
}

export function BakeryPlayfulHours({ section }: PublicSectionProps) {
  return (
    <PublicBand className="bakery-playful-hours" id="hours">
      <div data-bakery-reveal>
        <p className="bakery-playful-kicker">Portas abertas</p>
        <SectionHeading
          title={text(section.content, "title", "Passa por cá")}
          description={text(section.content, "text")}
        />
      </div>
      <div className="bakery-playful-hours__details" data-bakery-reveal>
        <p>
          <Clock3 aria-hidden="true" size={20} />
          {text(
            section.content,
            "hours",
            "Confirma o horário junto da equipa.",
          )}
        </p>
        <p>
          <MapPin aria-hidden="true" size={20} />
          {text(
            section.content,
            "address",
            "Morada disponível através da equipa.",
          )}
        </p>
      </div>
      <span aria-hidden="true" className="bakery-playful-hours__sticker" />
    </PublicBand>
  );
}

export function BakeryPlayfulFaq({ section, context }: PublicSectionProps) {
  return (
    <div className="bakery-playful-faq">
      <FaqSection context={context} section={section} />
    </div>
  );
}

export function BakeryPlayfulContact({ section, context }: PublicSectionProps) {
  return (
    <div className="bakery-playful-contact" id="custom-orders">
      <ContactSection context={context} section={section} />
    </div>
  );
}

export function BakeryPlayfulReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bakery-playful">{children}</div>;
}

export const bakeryPlayfulSectionRegistry: Record<
  string,
  ComponentType<PublicSectionProps>
> = {
  bakery_hero: BakeryPlayfulHero,
  bakery_products: BakeryPlayfulProducts,
  bakery_featured_products: BakeryPlayfulProducts,
  bakery_story: BakeryPlayfulStory,
  bakery_gallery: BakeryPlayfulGallery,
  bakery_testimonials: BakeryPlayfulTestimonials,
  bakery_opening_hours: BakeryPlayfulHours,
  bakery_seasonal_offers: BakeryPlayfulSeasonal,
  bakery_faq: BakeryPlayfulFaq,
  bakery_contact: BakeryPlayfulContact,
  bakery_celebration: BakeryPlayfulCelebration,
};
