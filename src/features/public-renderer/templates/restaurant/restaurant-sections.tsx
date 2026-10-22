import Image from "next/image";
import {
  CalendarCheck,
  ChefHat,
  Clock,
  Flame,
  MapPin,
  Sparkles,
  Star,
  Utensils,
  Wine,
} from "lucide-react";

import {
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
import {
  FineDiningChef,
  FineDiningDishes,
  FineDiningExperience,
  FineDiningGallery,
  FineDiningHeroEditorial,
  FineDiningMenu,
  FineDiningReviews,
} from "@/features/public-renderer/templates/restaurant/restaurant-fine-dining";
import {
  brandKitText,
  recordArray,
  recordText,
  restaurantToneClasses,
  restaurantVariant,
  restaurantVariantLabel,
} from "@/features/public-renderer/templates/restaurant/restaurant-utils";
import {
  PlayfulExperience,
  PlayfulGallery,
  PlayfulLocation,
  PlayfulMenuHighlights,
  PlayfulReservation,
  PlayfulRestaurantHero as PlayfulRestaurantHeroDesign,
  PlayfulReviews,
  PlayfulSignatureDishes,
} from "@/features/public-renderer/templates/restaurant/restaurant-playful";

function PlayfulSticker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border-2 border-[#2a1710] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#2a1710] shadow-[5px_5px_0_rgba(42,23,16,0.18)] ${className}`}
    >
      {children}
    </span>
  );
}

function PlayfulTicker({ items: tickerItems }: { items: string[] }) {
  return (
    <div className="relative mt-10 rounded-md border-2 border-[#2a1710] bg-[#2a1710] py-4 text-white shadow-[8px_8px_0_rgba(255,107,53,0.18)]">
      <ul
        aria-label="Detalhes da experiência"
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 text-center text-xs font-black uppercase tracking-[0.18em] sm:px-8 sm:text-sm"
      >
        {tickerItems.map((item, index) => (
          <li className="inline-flex items-center gap-8" key={`${item}-${index}`}>
            {item}
            {index < tickerItems.length - 1 ? (
              <span aria-hidden="true" className="text-[#ffd166]">✦</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RestaurantHeroSection({ context, section }: PublicSectionProps) {
  const variant = restaurantVariant(context);
  const tone = restaurantToneClasses(variant);
  const heroImage = text(section.content, "heroImage");
  const heroImageAlt = text(
    section.content,
    "heroImageAlt",
    text(section.content, "headline", context.page.title),
  );
  const highlights = recordArray(section.content, "highlights");

  if (variant === "fine_dining") {
    return <FineDiningHeroEditorial context={context} section={section} />;
  }

  if (variant === "playful") {
    return (
      <PlayfulRestaurantHeroDesign
        context={context}
        heroImage={heroImage}
        heroImageAlt={heroImageAlt}
        highlights={highlights}
        section={section}
      />
    );
  }

  return (
    <PublicBand className={`overflow-hidden pt-8 sm:pt-14 ${tone.hero}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${tone.badge}`}>
            {text(section.content, "eyebrow", restaurantVariantLabel(variant))}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {text(section.content, "headline", context.page.title)}
          </h1>
          <p className={`mt-5 max-w-2xl text-base leading-8 sm:text-lg ${tone.muted}`}>
            {text(
              section.content,
              "subheadline",
              "Uma experiência de mesa desenhada para criar desejo, vontade de voltar e reservas bem preparadas.",
            )}
          </p>
          <div className={`mt-7 max-w-2xl rounded-md border p-4 ${tone.card}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
              Brand promise
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 opacity-85">
              {brandKitText(
                section.content,
                "corePromise",
                "Abrir o apetite, mostrar o ambiente e tornar a reserva numa escolha fácil.",
              )}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-55">
              {brandKitText(section.content, "tagline", "Reserve a mesa certa.")}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="public-button-primary" href="#reservation">
              {text(section.content, "ctaPrimary", "Reservar mesa")}
            </a>
            <a className="public-button-outline" href="#menu">
              {text(section.content, "ctaSecondary", "Ver menu")}
            </a>
          </div>
          {highlights.length ? (
            <dl className="mt-9 grid gap-3 sm:grid-cols-3">
              {highlights.map((item, index) => (
                <div className={`rounded-md border p-4 ${tone.card}`} key={index}>
                  <dt className="text-xs font-bold uppercase tracking-wider opacity-60">
                    {recordText(item, ["label", "title"], "Destaque")}
                  </dt>
                  <dd className="mt-1 text-xl font-black">
                    {recordText(item, ["value", "text"], "Reserva")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="relative min-h-[390px] overflow-hidden rounded-md bg-white/10 shadow-2xl">
          {heroImage ? (
            <Image
              alt={heroImageAlt}
              className="object-cover transition duration-700 hover:scale-[1.03]"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              src={heroImage}
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[390px] items-center justify-center bg-gradient-to-br from-[var(--public-primary)] via-[var(--public-secondary)] to-[var(--public-accent)]">
              <Utensils aria-hidden="true" className="size-20 text-white/80" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 rounded-md bg-black/70 p-4 text-white backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--public-accent)]">
              {text(section.content, "proofLabel", "Reserva simples")}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">
              {text(
                section.content,
                "proofText",
                "Menu, horários, localização e pedido de reserva visíveis desde o primeiro scroll.",
              )}
            </p>
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlayfulRestaurantHero({
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
  const stickers = recordArray(section.content, "stickers");
  const ticker = recordArray(section.content, "ticker")
    .map((item) => recordText(item, ["label", "title"]))
    .filter(Boolean);
  const secondaryImage = text(section.content, "secondaryImage");
  const secondaryImageAlt = text(
    section.content,
    "secondaryImageAlt",
    "Prato colorido do Boca Pop",
  );

  return (
    <PublicBand className="relative overflow-hidden bg-[#fff3df] pt-8 text-slate-950 sm:pt-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,23,16,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(42,23,16,0.045)_1px,transparent_1px),radial-gradient(circle_at_14%_18%,rgba(255,107,53,0.24),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(255,209,102,0.38),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),transparent_54%)] bg-[size:28px_28px,28px_28px,auto,auto,auto]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-16 top-24 h-40 w-40 rounded-full border-[22px] border-[#ff6b35]/30"
      />
      <div
        aria-hidden="true"
        className="absolute right-8 top-16 hidden rotate-12 rounded-md bg-[#8ac926] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#17330b] shadow-[8px_8px_0_rgba(42,23,16,0.14)] lg:block"
      >
        group hungry
      </div>
      <div className="relative grid min-h-[620px] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="inline-flex w-fit rotate-[-1.5deg] rounded-full border-2 border-[#7c2d12] bg-[#ffd166] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#7c2d12] shadow-[5px_5px_0_rgba(124,45,18,0.16)]">
            {text(section.content, "eyebrow", "Boca Pop")}
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-[#2a1710] sm:text-7xl lg:text-[5.5rem]">
            {text(section.content, "headline", context.page.title)}
          </h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-[#6b3a24] sm:text-lg">
            {text(
              section.content,
              "subheadline",
              "Pratos vibrantes, cocktails autorais e mesas feitas para amigos, aniversários e noites que acabam tarde.",
            )}
          </p>
          <div className="mt-7 max-w-xl rounded-md border-2 border-[#ff6b35]/35 bg-white/82 p-4 shadow-[8px_8px_0_rgba(255,107,53,0.16)]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6b35]">
              Brand promise
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#4a2415]">
              {brandKitText(
                section.content,
                "corePromise",
                "Transformar vontade de sair numa reserva rápida com comida colorida, energia e partilha.",
              )}
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-[#7c2d12]/60">
              {brandKitText(section.content, "tagline", "Bring the table to life.")}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-md bg-[#ff6b35] px-7 py-3.5 text-sm font-black text-white shadow-[6px_6px_0_rgba(124,45,18,0.20)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e85d2c]"
              href="#reservation"
            >
              {text(section.content, "ctaPrimary", "Reservar grupo")}
            </a>
            <a
              className="inline-flex items-center justify-center rounded-md border-2 border-[#7c2d12] bg-white px-7 py-3.5 text-sm font-black text-[#7c2d12] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ffd166]"
              href="#menu"
            >
              {text(section.content, "ctaSecondary", "Ver favoritos")}
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <PlayfulSticker className="-rotate-2 bg-[#8ac926] text-[#17330b]">
              spicy tables
            </PlayfulSticker>
            <PlayfulSticker className="rotate-1 bg-[#ffd166] text-[#7c2d12]">
              birthday ready
            </PlayfulSticker>
            <PlayfulSticker className="-rotate-1 bg-white">
              share first
            </PlayfulSticker>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-4 top-8 z-10 rotate-[-5deg] rounded-md bg-[#7c2d12] px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-xl">
            {text(section.content, "proofLabel", "Reserva sem drama")}
          </div>
          <div className="absolute -right-2 top-28 z-10 rotate-6 rounded-full bg-[#ffd166] p-4 text-[#7c2d12] shadow-xl">
            <Flame aria-hidden="true" className="size-8" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_0.62fr]">
            <div className="relative min-h-[500px] overflow-hidden rounded-md border-4 border-white bg-[#ff6b35] shadow-[16px_16px_0_rgba(124,45,18,0.18)]">
              {heroImage ? (
                <Image
                  alt={heroImageAlt}
                  className="object-cover transition duration-700 hover:scale-[1.04]"
                  fill
                  priority
                  sizes="(min-width: 1024px) 36vw, 100vw"
                  src={heroImage}
                  unoptimized
                />
              ) : (
                <div className="flex h-full min-h-[500px] items-center justify-center bg-gradient-to-br from-[#ff6b35] via-[#ffd166] to-[#8ac926]">
                  <Utensils aria-hidden="true" className="size-20 text-white/85" />
                </div>
              )}
              <div className="absolute inset-x-4 bottom-4 rounded-md bg-white/92 p-4 text-[#3b1d12] shadow-xl backdrop-blur">
                <p className="text-sm font-black leading-6">
                  {text(
                    section.content,
                    "proofText",
                    "Pratos, grupos, eventos e contacto aparecem logo no primeiro ecrã.",
                  )}
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="relative min-h-[210px] overflow-hidden rounded-md border-4 border-white bg-[#ffd166] shadow-[10px_10px_0_rgba(124,45,18,0.14)]">
                {secondaryImage ? (
                  <Image
                    alt={secondaryImageAlt}
                    className="object-cover transition duration-700 hover:scale-[1.05]"
                    fill
                    sizes="(min-width: 1024px) 18vw, 80vw"
                    src={secondaryImage}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full min-h-[210px] items-center justify-center">
                    <Sparkles aria-hidden="true" className="size-12 text-[#7c2d12]" />
                  </div>
                )}
              </div>
              <div className="rounded-md border-4 border-[#2a1710] bg-white p-4 shadow-[10px_10px_0_rgba(255,107,53,0.20)]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6b35]">
                  Tonight plan
                </p>
                <p className="mt-2 text-2xl font-black leading-none text-[#2a1710]">
                  4 amigos
                  <br />
                  7 pratos
                  <br />
                  0 dramas
                </p>
                <p className="mt-3 text-xs font-bold leading-5 text-[#6b3a24]">
                  Escolhe a hora, chama o grupo e deixa a equipa preparar o resto.
                </p>
              </div>
            </div>
          </div>
          {stickers.length ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {stickers.map((item, index) => (
                <PlayfulSticker
                  className={
                    index % 3 === 0
                      ? "rotate-[-2deg] bg-[#8ac926] text-[#17330b]"
                      : index % 3 === 1
                        ? "rotate-2 bg-[#ffd166] text-[#7c2d12]"
                        : "rotate-[-1deg] bg-white"
                  }
                  key={index}
                >
                  {recordText(item, ["label", "title"], "Boca Pop")}
                </PlayfulSticker>
              ))}
            </div>
          ) : null}
          {highlights.length ? (
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {highlights.map((item, index) => (
                <div
                  className="rounded-md border-2 border-[#7c2d12]/15 bg-white p-4 shadow-[5px_5px_0_rgba(255,107,53,0.14)]"
                  key={index}
                >
                  <dt className="text-[10px] font-black uppercase tracking-wider text-[#ff6b35]">
                    {recordText(item, ["label", "title"], "Destaque")}
                  </dt>
                  <dd className="mt-1 text-xl font-black text-[#2a1710]">
                    {recordText(item, ["value", "text"], "Reserva")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
      <PlayfulTicker
        items={
          ticker.length
            ? ticker
            : ["book the table", "bring the group", "hot plates", "late cocktails"]
        }
      />
    </PublicBand>
  );
}

// Legacy implementation retained temporarily for comparison during the rollout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FineDiningHero({
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
  return (
    <PublicBand className="relative overflow-hidden bg-[#070707] pt-8 text-white sm:pt-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(212,175,55,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_34%)]"
      />
      <div className="relative grid min-h-[660px] gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-3 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#f5d98b]">
            <span className="h-px w-8 bg-[#f5d98b]" />
            {text(section.content, "eyebrow", "Fine Dining")}
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.96] tracking-tight sm:text-7xl lg:text-[5.6rem]">
            {text(section.content, "headline", context.page.title)}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
            {text(
              section.content,
              "subheadline",
              "Uma noite de degustação pensada para quem procura cozinha precisa, sala calma e serviço atento.",
            )}
          </p>
          <div className="mt-8 max-w-xl border-l border-[#d4af37]/45 pl-5">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#f5d98b]">
              Brand promise
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
              {brandKitText(
                section.content,
                "corePromise",
                "Uma noite conduzida por técnica, sazonalidade e serviço discreto do primeiro contacto à última mesa.",
              )}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/38">
              {brandKitText(
                section.content,
                "tagline",
                "Tasting nights, quietly unforgettable.",
              )}
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-md bg-[#f5d98b] px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-0.5 hover:bg-white"
              href="#reservation"
            >
              {text(section.content, "ctaPrimary", "Reservar degustação")}
            </a>
            <a
              className="inline-flex items-center justify-center rounded-md border border-white/16 bg-white/6 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/12"
              href="#menu"
            >
              {text(section.content, "ctaSecondary", "Ver menu")}
            </a>
          </div>
        </div>
        <div className="relative flex flex-col justify-end">
          <div className="relative min-h-[500px] w-full overflow-hidden rounded-md border border-white/10 bg-white/8 shadow-2xl shadow-black/40">
            {heroImage ? (
              <Image
                alt={heroImageAlt}
                className="object-cover transition duration-700 hover:scale-[1.025]"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                src={heroImage}
                unoptimized
              />
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center bg-gradient-to-br from-slate-950 via-stone-900 to-[#3f2f0f]">
                <Utensils aria-hidden="true" className="size-20 text-[#f5d98b]/80" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/78 to-transparent p-5 pt-24">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f5d98b]">
                {text(section.content, "proofLabel", "Menu degustação")}
              </p>
              <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-white/82">
                {text(
                  section.content,
                  "proofText",
                  "Sete momentos, sala intimista e reserva acompanhada por email.",
                )}
              </p>
            </div>
          </div>
          {highlights.length ? (
            <dl className="relative z-10 mt-4 grid gap-3 sm:grid-cols-3">
              {highlights.map((item, index) => (
                <div
                  className="min-w-0 rounded-md border border-white/12 bg-[#111]/88 p-4 shadow-xl backdrop-blur"
                  key={index}
                >
                  <dt className="break-words text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                    {recordText(item, ["label", "title"], "Destaque")}
                  </dt>
                  <dd className="mt-1 break-words text-lg font-black leading-tight text-[#f5d98b]">
                    {recordText(item, ["value", "text"], "Reserva")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </PublicBand>
  );
}

export function RestaurantMenuHighlightsSection({ context, section }: PublicSectionProps) {
  const list = items(section.content);
  const layout = text(section.content, "layout");

  if (layout === "fine_dining") {
    return <FineDiningMenu section={section} context={context} />;
    /*
    return (
      <PublicBand className="bg-[#f7f1e6]" id="menu">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8a6a20]">
              Tasting sequence
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              {text(section.content, "title", "Menu que apresenta a experiência")}
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-slate-600">
              {text(section.content, "text")}
            </p>
          </div>
          <div className="grid gap-3">
            {list.map((item, index) => (
              <article
                className="group grid gap-4 rounded-md border border-black/10 bg-white/82 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:grid-cols-[72px_1fr_auto]"
                key={index}
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-[#f5d98b]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6a20]">
                    {itemText(item, "category", "Momento")}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    {itemText(item, "title", itemText(item, "name", "Prato de assinatura"))}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {itemText(item, "description", "")}
                  </p>
                </div>
                <span className="h-fit rounded-full bg-[#f5d98b]/45 px-3 py-1 text-xs font-black text-slate-950">
                  {itemText(item, "price", "Menu")}
                </span>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
    */
  }

  if (restaurantVariant(context) === "playful") {
    return <PlayfulMenuHighlights context={context} section={section} />;
  }

  if (layout === "playful") {
    return (
      <PublicBand className="relative overflow-hidden bg-[#fffbeb]" id="menu">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-24 bg-[repeating-linear-gradient(-8deg,rgba(255,107,53,0.10)_0,rgba(255,107,53,0.10)_10px,transparent_10px,transparent_22px)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title={text(section.content, "title", "Favoritos da mesa")}
            description={text(section.content, "text")}
          />
          <p className="w-fit rotate-[-1deg] rounded-md border-2 border-[#7c2d12] bg-[#ffd166] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#7c2d12] shadow-[4px_4px_0_rgba(124,45,18,0.14)]">
            Made to share
          </p>
        </div>
        <div className="relative mt-8 grid gap-5 md:grid-cols-3">
          {list.map((item, index) => (
            <article
              className={`group rounded-md border-2 border-[#7c2d12]/14 p-5 shadow-[7px_7px_0_rgba(255,107,53,0.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(255,107,53,0.20)] ${
                index % 2 === 0 ? "rotate-[-1deg] hover:rotate-[-2deg]" : "rotate-[1deg] hover:rotate-2"
              } ${
                index % 3 === 0
                  ? "bg-white"
                  : index % 3 === 1
                    ? "bg-[#fff0c2]"
                    : "bg-[#f0ffd9]"
              }`}
              key={index}
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-[#ff6b35] text-lg font-black text-white shadow-[4px_4px_0_rgba(124,45,18,0.16)]">
                {index + 1}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#ff6b35]/12 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#ff6b35]">
                  {itemText(item, "category", "Favorito")}
                </span>
                <span className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-black text-[#7c2d12]">
                  {itemText(item, "price", "Mesa")}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-black leading-tight text-[#2a1710]">
                {itemText(item, "title", itemText(item, "name", "Prato da casa"))}
              </h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#6b3a24]">
                {itemText(item, "description", "")}
              </p>
            </article>
          ))}
        </div>
        <div className="relative mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border-2 border-[#2a1710]/12 bg-[#2a1710] p-6 text-white shadow-[9px_9px_0_rgba(255,107,53,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd166]">
              Rewards energy
            </p>
            <h3 className="mt-3 max-w-2xl text-3xl font-black leading-tight">
              Do primeiro brinde ao próximo plano, a mesa fica fácil de repetir.
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["+500 pts", "2x cocktails", "group drop", "story ready"].map((item, index) => (
              <div
                className={`rounded-md border-2 border-[#2a1710]/12 p-4 text-center text-xl font-black shadow-[5px_5px_0_rgba(42,23,16,0.12)] ${
                  index % 2 === 0 ? "bg-[#ffd166] text-[#7c2d12]" : "bg-white text-[#ff6b35]"
                }`}
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="menu">
      <SectionHeading
        title={text(section.content, "title", "Menu em destaque")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {list.map((item, index) => (
          <article className="public-card group overflow-hidden" key={index}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[var(--public-primary)]">
                  {itemText(item, "category", "Prato")}
                </p>
                <h3 className="mt-2 text-xl font-black">
                  {itemText(item, "title", itemText(item, "name", "Prato de assinatura"))}
                </h3>
              </div>
              <span className="rounded-full bg-[var(--public-primary)]/10 px-3 py-1 text-xs font-black text-[var(--public-primary)]">
                {itemText(item, "price", "Menu")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "description", "Descrição curta preparada para criar apetite e clarificar valor.")}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function RestaurantSignatureDishesSection({ context, section }: PublicSectionProps) {
  const dishes = items(section.content);
  const layout = text(section.content, "layout");

  if (layout === "fine_dining") return <FineDiningDishes section={section} context={context} />;

  if (restaurantVariant(context) === "playful") {
    return <PlayfulSignatureDishes context={context} section={section} />;
  }

  if (layout === "playful") {
    return (
      <PublicBand className="relative overflow-hidden bg-[#ff6b35] text-white" id="signature-dishes">
        <div
          aria-hidden="true"
          className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-[#ffd166]/25"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-6 hidden rotate-[-10deg] rounded-md bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-[#ff6b35] shadow-xl md:block"
        >
          bring friends
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/65">
              Social proof moments
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              {text(section.content, "title", "O que puxa pela reserva")}
            </h2>
            <p className="mt-4 leading-7 text-white/78">
              {text(section.content, "text")}
            </p>
          </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {dishes.map((item, index) => (
            <article
                className="overflow-hidden rounded-md border-2 border-white/20 bg-white text-[#2a1710] shadow-[8px_8px_0_rgba(124,45,18,0.22)] transition duration-300 hover:-translate-y-1"
                key={index}
              >
                {itemText(item, "image") ? (
                  <div className="relative aspect-[16/10] bg-[#ffd166]">
                    <Image
                      alt={itemText(item, "imageAlt", itemText(item, "title", "Prato de assinatura"))}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw"
                      src={itemText(item, "image")}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-5">
                <span className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#7c2d12]">
                  {itemText(item, "label", "Social")}
                </span>
                <h3 className="mt-4 text-xl font-black">
                  {itemText(item, "title", "Momento da mesa")}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#6b3a24]">
                  {itemText(item, "description", "")}
                </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand className="bg-[var(--public-surface)]" id="signature-dishes">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          title={text(section.content, "title", "Pratos que fazem a reserva")}
          description={text(section.content, "text")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {dishes.map((item, index) => (
            <article className="overflow-hidden rounded-md border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg" key={index}>
              {itemText(item, "image") ? (
                <div className="relative aspect-[16/10] bg-stone-100">
                  <Image
                    alt={itemText(item, "imageAlt", itemText(item, "title", "Prato de assinatura"))}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw"
                    src={itemText(item, "image")}
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="p-5">
              <div className="flex items-center gap-2 text-[var(--public-primary)]">
                <Sparkles aria-hidden="true" className="size-4" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {itemText(item, "label", "Assinatura")}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-black">
                {itemText(item, "title", "Especial da casa")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
                {itemText(item, "description", "")}
              </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function RestaurantExperienceSection({ context, section }: PublicSectionProps) {
  const list = items(section.content);
  const layout = text(section.content, "layout");

  if (layout === "fine_dining") return <FineDiningExperience section={section} context={context} />;

  if (restaurantVariant(context) === "playful") {
    return <PlayfulExperience context={context} section={section} />;
  }

  if (layout === "fine_dining") {
    return (
      <PublicBand className="bg-[#0d0d0d] text-white" id="experience">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#f5d98b]">
              Service rhythm
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              {text(section.content, "title", "Uma noite em quatro tempos")}
            </h2>
            <p className="mt-4 leading-7 text-white/68">
              {text(section.content, "text")}
            </p>
          </div>
          <div className="grid gap-0 border-y border-white/10">
            {list.map((item, index) => (
              <article
                className="grid gap-4 border-b border-white/10 py-6 last:border-b-0 sm:grid-cols-[96px_1fr]"
                key={index}
              >
                <p className="text-4xl font-black text-[#f5d98b]/70">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="text-xl font-black">
                    {itemText(item, "title", "Momento")}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                    {itemText(item, "description", "")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  if (layout === "playful") {
    return (
      <PublicBand className="bg-[#2a1710] text-white" id="experience">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PlayfulSticker className="rotate-[-2deg] bg-[#ffd166] text-[#7c2d12]">
              group flow
            </PlayfulSticker>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              {text(section.content, "title", "Da mensagem no grupo a mesa marcada")}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/70">
              {text(section.content, "text")}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {list.map((item, index) => (
            <article
              className="rounded-md border-2 border-white/12 bg-white/8 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/12"
              key={index}
            >
              <p className="text-5xl font-black text-[#ffd166]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-black">
                {itemText(item, "title", "Momento")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {itemText(item, "description", "")}
              </p>
            </article>
          ))}
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="experience">
      <SectionHeading
        title={text(section.content, "title", "Experiência de sala")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {list.map((item, index) => (
          <article className="public-card" key={index}>
            <Wine aria-hidden="true" className="size-6 text-[var(--public-primary)]" />
            <h3 className="mt-4 text-lg font-black">
              {itemText(item, "title", "Momento")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "description", "")}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function RestaurantChefStorySection({ context, section }: PublicSectionProps) {
  if (text(section.content, "layout") === "fine_dining") return <FineDiningChef section={section} context={context} />;
  const portraitImage = text(section.content, "portraitImage");
  const portraitAlt = text(section.content, "portraitAlt", text(section.content, "title"));

  return (
    <PublicBand className="bg-slate-950 text-white" id="chef">
      <div className="grid items-center gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-md border border-white/10 bg-white/8 p-6">
          {portraitImage ? (
            <Image
              alt={portraitAlt}
              className="object-cover opacity-72"
              fill
              sizes="(min-width: 1024px) 36vw, 100vw"
              src={portraitImage}
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/58 to-transparent" />
          <div className="relative flex h-full min-h-[360px] flex-col justify-end">
          <ChefHat aria-hidden="true" className="size-10 text-[var(--public-accent)]" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-white/45">
            {text(section.content, "eyebrow", "Chef story")}
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight">
            {text(section.content, "title", "Cozinha com ponto de vista")}
          </h2>
          </div>
        </div>
        <div>
          <p className="text-base leading-8 text-white/72 sm:text-lg">
            {text(
              section.content,
              "text",
              "Uma narrativa curta sobre técnica, origem dos ingredientes e experiência de mesa.",
            )}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {recordArray(section.content, "notes").map((item, index) => (
              <div className="rounded-md border border-white/10 bg-white/7 p-4" key={index}>
                <p className="text-xs font-black uppercase tracking-wider text-[#f5d98b]">
                  {recordText(item, ["label", "title"], "Nota")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {recordText(item, ["value", "text"], "")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

export function RestaurantReviewsSection({ context, section }: PublicSectionProps) {
  if (text(section.content, "layout") === "fine_dining") return <FineDiningReviews section={section} context={context} />;
  if (restaurantVariant(context) === "playful") {
    return <PlayfulReviews context={context} section={section} />;
  }
  const list = items(section.content);

  return (
    <PublicBand id="reviews">
      <SectionHeading
        title={text(section.content, "title", "Prova social")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {list.map((item, index) => (
          <article className="public-card" key={index}>
            <div className="mb-5 flex items-center gap-3">
              {itemText(item, "image") ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[var(--public-surface)]">
                  <Image
                    alt={itemText(item, "imageAlt", itemText(item, "name", "Cliente"))}
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={itemText(item, "image")}
                    style={{ objectPosition: itemText(item, "imagePosition", "center") }}
                    unoptimized
                  />
                </div>
              ) : null}
              <div>
                <p className="text-sm font-black">
                  {itemText(item, "name", "Cliente")}
                </p>
                {itemText(item, "context") ? (
                  <p className="text-xs font-semibold text-[var(--public-muted)]">
                    {itemText(item, "context")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-1 text-[var(--public-accent)]">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star aria-hidden="true" className="size-4 fill-current" key={starIndex} />
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "quote", itemText(item, "description", ""))}
            </p>
          </article>
        ))}
      </div>
    </PublicBand>
  );
}

export function RestaurantReservationSection({ context, section }: PublicSectionProps) {
  if (restaurantVariant(context) === "playful") {
    return <PlayfulReservation context={context} section={section} />;
  }
  const details = recordArray(section.content, "details");

  return (
    <>
      <PublicBand className="bg-[var(--public-primary)] text-white" id="reservation">
        <div className="relative overflow-hidden rounded-md border border-white/10 bg-black/18 p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(245,217,139,0.24),transparent_32%)] lg:block"
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.82fr]">
            <div>
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em]">
                {text(section.content, "eyebrow", "Reservas")}
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
                {text(section.content, "title", "Reserve a próxima mesa")}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                {text(section.content, "text", "Pedido de reserva claro, rápido e respondido por uma equipa atenta.")}
              </p>
              <a className="mt-7 inline-flex rounded-md bg-white px-6 py-3 text-sm font-black text-[var(--public-primary)] transition hover:-translate-y-0.5" href="#contact">
                {text(section.content, "ctaPrimary", "Pedir reserva")}
              </a>
            </div>
            <div className="grid gap-3">
              {details.map((item, index) => (
                <div className="rounded-md border border-white/12 bg-white/10 p-4" key={index}>
                  <p className="text-xs font-black uppercase tracking-wider text-white/50">
                    {recordText(item, ["label", "title"], "Detalhe")}
                  </p>
                  <p className="mt-1 font-semibold">
                    {recordText(item, ["value", "text"], "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicBand>
      {restaurantVariant(context) === "fine_dining" ? (
        <ContactSection
          context={context}
          description="Indique a data, a hora e o número de pessoas. A equipa confirmará a disponibilidade por email."
          section={section}
          title="Pedir uma reserva"
        />
      ) : null}
    </>
  );
}

export function RestaurantLocationSection({ context, section }: PublicSectionProps) {
  const address = text(section.content, "address", "Morada confirmada no contacto de reserva.");
  const mapQuery = text(section.content, "mapQuery", address);

  if (restaurantVariant(context) === "playful") {
    return <PlayfulLocation address={address} context={context} mapQuery={mapQuery} section={section} />;
  }

  return (
    <PublicBand id="location">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            title={text(section.content, "title", "Localização e horários")}
            description={text(section.content, "text")}
          />
          <div className="mt-6 grid gap-3">
            <p className="flex items-start gap-3 text-sm leading-6 text-[var(--public-muted)]">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 text-[var(--public-primary)]" />
              {address}
            </p>
            <p className="flex items-start gap-3 text-sm leading-6 text-[var(--public-muted)]">
              <Clock aria-hidden="true" className="mt-0.5 size-5 text-[var(--public-primary)]" />
              {text(section.content, "hours", "Horário confirmado pela equipa.")}
            </p>
            <p className="flex items-start gap-3 text-sm leading-6 text-[var(--public-muted)]">
              <CalendarCheck aria-hidden="true" className="mt-0.5 size-5 text-[var(--public-primary)]" />
              {text(section.content, "reservationNote", "Reservas mediante disponibilidade.")}
            </p>
          </div>
        </div>
        {mapQuery ? (
          <iframe
            className="min-h-72 w-full rounded-md border border-black/10 bg-[var(--public-surface)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            title={`Mapa de ${text(section.content, "title", "restaurante")}`}
          />
        ) : (
          <div className="min-h-72 rounded-md border border-dashed border-slate-300 bg-[var(--public-surface)] p-6 text-sm text-[var(--public-muted)]">
            {text(section.content, "mapNote", "A equipa envia indicações de chegada quando confirma a reserva.")}
          </div>
        )}
      </div>
    </PublicBand>
  );
}

export function RestaurantGallerySection({ context, section }: PublicSectionProps) {
  const list = items(section.content);
  const layout = text(section.content, "layout");

  if (layout === "fine_dining") return <FineDiningGallery section={section} context={context} />;

  if (restaurantVariant(context) === "playful") {
    return <PlayfulGallery context={context} section={section} />;
  }

  if (layout === "playful") {
    return (
      <PublicBand className="relative overflow-hidden bg-[#fff3df]" id="gallery">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,107,53,0.18),transparent_26%),radial-gradient(circle_at_80%_78%,rgba(138,201,38,0.16),transparent_24%)]"
        />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title={text(section.content, "title", "Momentos que a mesa vai comentar")}
              description={text(section.content, "text")}
            />
            <PlayfulSticker className="rotate-3 bg-[#8ac926] text-[#17330b]">
              Mesa pronta
            </PlayfulSticker>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((item, index) => (
              <article
                className={`overflow-hidden rounded-md border-2 border-[#2a1710]/12 bg-white shadow-[7px_7px_0_rgba(42,23,16,0.12)] ${
                  index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                }`}
                key={index}
              >
                {itemText(item, "image") ? (
                  <div className="relative aspect-[4/3] bg-[#ffd166]">
                    <Image
                      alt={itemText(item, "imageAlt", itemText(item, "label", "Momento de restaurante"))}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                      src={itemText(item, "image")}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#ff6b35]">
                  {itemText(item, "label", "Asset")}
                </p>
                <p className="mt-4 text-sm font-semibold leading-6 text-[#5b3422]">
                  {itemText(item, "description", itemText(item, "title", ""))}
                </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  if (layout === "fine_dining") {
    return (
      <PublicBand className="bg-[#f7f1e6]" id="gallery">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            title={text(section.content, "title", "Detalhes que definem a noite")}
            description={text(section.content, "text")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((item, index) => (
              <article
                className="overflow-hidden border-l border-[#8a6a20]/35 bg-white/70"
                key={index}
              >
                {itemText(item, "image") ? (
                  <div className="relative aspect-[16/10] bg-stone-100">
                    <Image
                      alt={itemText(item, "imageAlt", itemText(item, "label", "Detalhe do restaurante"))}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw"
                      src={itemText(item, "image")}
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6a20]">
                  {itemText(item, "label", "Asset")}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {itemText(item, "description", itemText(item, "title", ""))}
                </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PublicBand>
    );
  }

  return (
    <PublicBand id="gallery">
      <SectionHeading
        title={text(section.content, "title", "Ambiente e pratos")}
        description={text(section.content, "text")}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((item, index) => (
          <div className="overflow-hidden rounded-md bg-[var(--public-surface)]" key={index}>
            {itemText(item, "image") ? (
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  alt={itemText(item, "imageAlt", itemText(item, "label", "Ambiente de restaurante"))}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                  src={itemText(item, "image")}
                  unoptimized
                />
              </div>
            ) : null}
            <div className="p-5">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--public-primary)]">
              {itemText(item, "label", "Imagem")}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
              {itemText(item, "description", itemText(item, "title", ""))}
            </p>
            </div>
          </div>
        ))}
      </div>
    </PublicBand>
  );
}
