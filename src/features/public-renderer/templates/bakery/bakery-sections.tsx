import Image from "next/image";
import { ArrowUpRight, CakeSlice, Clock3, MapPin, Palette, PartyPopper, Sparkles } from "lucide-react";

import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { ContactSection } from "@/features/public-renderer/components/sections/contact-section";
import { itemText, items, text } from "@/features/public-renderer/components/section-utils";
import type { PublicSectionProps } from "@/features/public-renderer/types";

function image(item: Record<string, unknown>, fallback: string) {
  return itemText(item, "image", fallback);
}

function BakeryCard({ item, index }: { item: Record<string, unknown>; index: number }) {
  const title = itemText(item, "title", itemText(item, "name", "Produto"));
  return (
    <article className={`group overflow-hidden rounded-[2rem] border-2 border-[#2a1710] bg-white shadow-[7px_7px_0_rgba(42,23,16,0.14)] transition duration-300 hover:-translate-y-2 hover:shadow-[10px_12px_0_rgba(42,23,16,0.18)] ${index % 2 ? "rotate-[1deg]" : "-rotate-[1deg]"}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#fff0f4]">
        <Image alt={itemText(item, "imageAlt", title)} className="object-cover transition duration-500 group-hover:scale-105" fill sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw" src={image(item, "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=82")} unoptimized />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#ffd166] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#2a1710]"><Sparkles aria-hidden="true" size={12} />{itemText(item, "label", "feito hoje")}</span>
      </div>
      <div className="p-6"><h3 className="text-xl font-black text-[#2a1710]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6b4b43]">{itemText(item, "description", itemText(item, "text", "Uma criação da casa, feita para partilhar."))}</p></div>
    </article>
  );
}

export function BakeryHeroSection({ section }: PublicSectionProps) {
  const c = section.content;
  const heroImage = text(c, "heroImage", "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=1400&q=82");
  return <PublicBand className="overflow-hidden bg-[#fff7e8] pt-12 sm:pt-20" id="hero">
    <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative z-10"><span className="inline-flex rotate-[-3deg] items-center gap-2 rounded-full border-2 border-[#2a1710] bg-[#5eead4] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#2a1710] shadow-[4px_4px_0_#2a1710]"><Sparkles size={14} /> {text(c, "eyebrow", "Bolos que contam histórias")}</span><h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.04em] text-[#2a1710] sm:text-7xl">{text(c, "headline", "A tua próxima fatia favorita chegou.")}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#6b4b43]">{text(c, "subheadline", "Bolos personalizados, doces coloridos e encomendas feitas para transformar qualquer dia numa celebração.")}</p><div className="mt-8 flex flex-wrap gap-3"><a className="inline-flex items-center gap-2 rounded-full border-2 border-[#2a1710] bg-[#ff4f81] px-6 py-3 font-black text-white shadow-[5px_5px_0_#2a1710] transition hover:-translate-y-1" href="#custom-orders">{text(c, "ctaPrimary", "Criar o meu bolo")} <ArrowUpRight size={18} /></a><a className="inline-flex items-center rounded-full border-2 border-[#2a1710] bg-white px-6 py-3 font-black text-[#2a1710] transition hover:-translate-y-1" href="#products">{text(c, "ctaSecondary", "Ver os mais pedidos")}</a></div></div>
      <div className="relative mx-auto w-full max-w-xl rotate-[2deg] rounded-[2.5rem] border-2 border-[#2a1710] bg-[#ffd166] p-3 shadow-[12px_12px_0_#2a1710]"><div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-2 border-[#2a1710]"><Image alt={text(c, "heroImageAlt", "Bolo colorido decorado para uma celebração") } className="object-cover" fill sizes="(min-width: 1024px) 42vw, 100vw" src={heroImage} unoptimized /></div><span className="absolute -bottom-5 -left-5 rounded-full border-2 border-[#2a1710] bg-[#5eead4] px-5 py-3 text-sm font-black text-[#2a1710] shadow-[5px_5px_0_#2a1710]">feito com alegria ✦</span><span aria-hidden="true" className="animate-[bakeryFloat_5s_ease-in-out_infinite] absolute -right-5 -top-7 rounded-full border-2 border-[#2a1710] bg-[#ff4f81] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[5px_5px_0_#2a1710]">feito à mão ✦</span></div>
    </div>
  </PublicBand>;
}

export function BakeryCelebrationSection({ section }: PublicSectionProps) {
  const options = items(section.content);
  const defaults = [
    { title: "Uma festa colorida", description: "Camadas alegres, cobertura leve e detalhes para pôr toda a mesa a sorrir.", icon: "palette" },
    { title: "Um momento só teu", description: "Uma criação desenhada à medida da ocasião, das cores e das pessoas que queres surpreender.", icon: "cake" },
    { title: "Para levar e partilhar", description: "Doces frescos, fáceis de escolher e prontos para aparecer nas fotografias certas.", icon: "party" },
  ];
  const iconMap = { cake: CakeSlice, palette: Palette, party: PartyPopper } as const;

  return (
    <PublicBand className="relative overflow-hidden bg-[#2a1710] text-[#fff7e8]" id="celebration">
      <span aria-hidden="true" className="absolute -right-4 top-10 rotate-12 text-7xl text-[#ffd166] opacity-80">✦</span>
      <span aria-hidden="true" className="absolute bottom-8 left-8 -rotate-12 text-5xl text-[#5eead4] opacity-80">✷</span>
      <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <SectionHeading title={text(section.content, "title", "Que sabor tem a tua celebração?")} description={text(section.content, "text", "Escolhe a energia. A Boca Doce trata do resto, com cor, cuidado e uma receita feita para a tua ocasião.")} descriptionClassName="text-[#fff7e8]/85" />
        <div className="grid gap-4 md:grid-cols-3">
          {(options.length ? options : defaults).slice(0, 3).map((item, index) => {
            const Icon = iconMap[itemText(item, "icon", defaults[index].icon) as keyof typeof iconMap] ?? Sparkles;
            return <article className="group rounded-[1.75rem] border-2 border-[#fff7e8]/30 bg-[#fff7e8]/10 p-5 transition duration-300 hover:-translate-y-2 hover:bg-[#fff7e8] hover:text-[#2a1710]" key={index}><Icon aria-hidden="true" className="size-8 text-[#ffd166] transition group-hover:scale-110 group-hover:text-[#ff4f81]" /><h3 className="mt-8 text-xl font-black">{itemText(item, "title", defaults[index].title)}</h3><p className="mt-2 text-sm leading-6 text-[#fff7e8]/75 group-hover:text-[#6b4b43]">{itemText(item, "description", defaults[index].description)}</p></article>;
          })}
        </div>
      </div>
    </PublicBand>
  );
}

export function BakeryProductsSection({ section }: PublicSectionProps) { const list = items(section.content); return <PublicBand className="bg-[#fff7e8]" id="products"><SectionHeading title={text(section.content, "title", "Os mais pedidos") } description={text(section.content, "text", "Doces com cor, textura e personalidade para levar ou partilhar.")} /><div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{(list.length ? list : [{ title: "Bolo da casa", description: "Uma criação colorida feita no próprio dia." }]).map((item, index) => <BakeryCard index={index} item={item} key={index} />)}</div></PublicBand>; }
export function BakeryFeaturedProductsSection(props: PublicSectionProps) { return <BakeryProductsSection {...props} />; }

export function BakeryStorySection({ section }: PublicSectionProps) { const c = section.content; return <PublicBand className="bg-[#ff4f81] text-white" id="story"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><SectionHeading title={text(c, "title", "Uma pequena fábrica de grandes momentos") } description={text(c, "text", "A Boca Doce mistura receitas de família, cor e uma dose generosa de imaginação em cada encomenda.")} /><div className="grid gap-4 sm:grid-cols-3">{items(c).slice(0, 3).map((item, index) => <div className="rounded-[1.5rem] border-2 border-[#2a1710] bg-[#fff7e8] p-5 text-[#2a1710] shadow-[5px_5px_0_#2a1710]" key={index}><p className="text-3xl font-black">0{index + 1}</p><h3 className="mt-3 font-black">{itemText(item, "title", "Momento")}</h3><p className="mt-2 text-sm leading-6 text-[#6b4b43]">{itemText(item, "description", "Feito para celebrar.")}</p></div>)}</div></div></PublicBand>; }
export function BakeryGallerySection({ section }: PublicSectionProps) { const list = items(section.content); return <PublicBand className="bg-[#5eead4]" id="gallery"><SectionHeading title={text(section.content, "title", "Visto na mesa") } description={text(section.content, "text", "Cor, cobertura e detalhes que pedem uma fotografia.")} /><div className="mt-10 grid auto-rows-[180px] gap-4 sm:grid-cols-3">{(list.length ? list : [{ title: "Detalhe doce", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=82" }]).map((item, index) => <div className={`relative overflow-hidden rounded-[1.5rem] border-2 border-[#2a1710] ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`} key={index}><Image alt={itemText(item, "imageAlt", itemText(item, "title", "Produto de pastelaria"))} className="object-cover transition duration-500 hover:scale-105" fill sizes="(min-width: 768px) 33vw, 100vw" src={image(item, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=82")} unoptimized /><span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2a1710]">{itemText(item, "label", "Boca Doce")}</span></div>)}</div></PublicBand>; }
export function BakeryTestimonialsSection({ section }: PublicSectionProps) { const list = items(section.content); return <PublicBand className="bg-[#fff7e8]" id="testimonials"><SectionHeading title={text(section.content, "title", "Quem provou, voltou") } description={text(section.content, "text", "Pequenas mensagens de quem trouxe a Boca Doce para a sua mesa.")} /><div className="mt-10 grid gap-5 md:grid-cols-3">{(list.length ? list : [{ name: "Inês", quote: "O bolo chegou lindo e ainda mais delicioso do que imaginava." }]).map((item, index) => <figure className="rounded-[1.5rem] border-2 border-[#2a1710] bg-white p-6 shadow-[5px_5px_0_rgba(42,23,16,0.12)]" key={index}><div className="text-3xl text-[#ff4f81]">“</div><blockquote className="mt-2 text-lg font-bold leading-7 text-[#2a1710]">{itemText(item, "quote", "Foi amor à primeira dentada.")}</blockquote><figcaption className="mt-5 text-sm font-black text-[#6b4b43]">{itemText(item, "name", "Cliente Boca Doce")}</figcaption></figure>)}</div></PublicBand>; }
export function BakerySeasonalOffersSection({ section }: PublicSectionProps) {
  const list = items(section.content);

  return (
    <PublicBand className="bg-[#ffcf56]" id="seasonal-offers">
      <SectionHeading
        title={text(section.content, "title", "Edições da semana")}
        description={text(
          section.content,
          "text",
          "Sabores sazonais, fornadas pequenas e uma boa razão para voltar esta semana.",
        )}
      />
      <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {(list.length
          ? list
          : [
              {
                title: "Tarte de frutos vermelhos",
                label: "edição limitada",
                description: "Creme leve, fruta fresca e uma base crocante para partilhar.",
              },
            ]
        ).map((item, index) => (
          <BakeryCard index={index} item={item} key={index} />
        ))}
      </div>
    </PublicBand>
  );
}
export function BakeryOpeningHoursSection({ section }: PublicSectionProps) { const c = section.content; return <PublicBand className="bg-[#ffd166]" id="hours"><div className="grid gap-8 md:grid-cols-2 md:items-center"><SectionHeading title={text(c, "title", "Passa por cá") } description={text(c, "text", "A vitrine muda com a semana. A vontade pode aparecer a qualquer hora.")} /><div className="rounded-[1.5rem] border-2 border-[#2a1710] bg-white p-6 text-[#2a1710] shadow-[6px_6px_0_#2a1710]"><p className="flex items-center gap-2 font-black"><Clock3 size={18} /> {text(c, "hours", "Terça a sábado · 09:00–18:30")}</p><p className="mt-3 flex items-center gap-2 text-sm"><MapPin size={18} /> {text(c, "address", "Rua da Alegria, Lisboa")}</p></div></div></PublicBand>; }
export function BakeryContactSection(props: PublicSectionProps) { return <ContactSection {...props} />; }
