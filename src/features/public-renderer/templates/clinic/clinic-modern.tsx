import Image from "next/image";
import { ArrowUpRight, Stethoscope } from "lucide-react";

import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import {
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import { recordArray } from "@/features/public-renderer/templates/clinic/clinic-utils";
import type { PublicSectionProps } from "@/features/public-renderer/types";

const fallbackHero =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85";

export function ModernClinicHero({ context, section }: PublicSectionProps) {
  const c = section.content;
  const image = text(c, "heroImage", fallbackHero);
  return (
    <section
      className="clinic-modern-hero relative isolate min-h-[min(760px,86vh)] overflow-hidden bg-slate-950 text-white"
      id="hero"
    >
      <Image
        alt={text(
          c,
          "heroImageAlt",
          "Profissional de saúde a acompanhar uma consulta",
        )}
        className="object-cover object-center"
        fill
        priority
        sizes="100vw"
        src={image}
        unoptimized
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,32,36,.96)_0%,rgba(7,32,36,.72)_38%,rgba(7,32,36,.16)_78%,rgba(7,32,36,.35)_100%)]"
      />
      <div className="relative mx-auto flex min-h-[min(760px,86vh)] max-w-7xl flex-1 items-end px-5 pt-32 pb-32 sm:px-8 sm:pb-36 lg:px-12">
        <div className="max-w-3xl" data-clinic-reveal="hero-copy">
          <p className="inline-flex items-center gap-2 text-xs font-black tracking-[.2em] text-teal-200 uppercase">
            <span className="size-2 rounded-full bg-emerald-300" />
            {text(c, "eyebrow", "NexaCare Studio · saúde simples e humana")}
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[.96] font-black tracking-[-.04em] sm:text-7xl lg:text-8xl">
            {text(c, "headline", context.page.title)}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">
            {text(
              c,
              "subheadline",
              "Cuidados de saúde com tempo para si, uma equipa próxima e um próximo passo claro.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-teal-200 px-6 py-3 font-black text-slate-950 transition hover:-translate-y-1 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
              href="#booking"
            >
              {text(c, "ctaPrimary", "Pedir consulta")}{" "}
              <ArrowUpRight size={18} />
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3 font-black transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="#clinic-specialties"
            >
              {text(c, "ctaSecondary", "Conhecer a equipa")}
            </a>
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/20 bg-slate-950/75 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 sm:grid-cols-3 sm:px-8 lg:px-12">
          {recordArray(c, "stats")
            .slice(0, 3)
            .map((item, index) => {
              return (
                <div className="text-sm" key={index}>
                  <span className="block text-xs font-black tracking-widest text-teal-200 uppercase">
                    {itemText(item, "label", "NexaCare")}
                  </span>
                  <span className="mt-1 block font-bold text-white/85">
                    {itemText(
                      item,
                      "value",
                      itemText(item, "text", "Acompanhamento próximo"),
                    )}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

export function ModernClinicSpecialties({ section }: PublicSectionProps) {
  const list = items(section.content);
  return (
    <PublicBand className="bg-white" id="clinic-specialties">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Cuidados que começam pela clareza",
          )}
          description={text(
            section.content,
            "text",
            "Conheça as áreas de cuidado da clínica e encontre o próximo passo com informação simples.",
          )}
        />
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {list.map((item, index) => (
            <article
              className="group grid gap-4 py-6 transition hover:pl-3 sm:grid-cols-[56px_1fr_auto] sm:items-start"
              key={index}
              data-clinic-reveal="row"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-teal-50 text-sm font-black text-teal-700">
                0{index + 1}
              </span>
              <div>
                <p className="text-xs font-black tracking-[.18em] text-teal-700 uppercase">
                  {itemText(item, "category", "Área de cuidado")}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {itemText(
                    item,
                    "name",
                    itemText(item, "title", "Especialidade"),
                  )}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
                  {itemText(
                    item,
                    "description",
                    "Uma conversa clara para perceber o acompanhamento adequado.",
                  )}
                </p>
              </div>
              <Stethoscope
                aria-hidden="true"
                className="hidden size-5 text-teal-600 sm:block"
              />
            </article>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function ModernClinicJourney({ section }: PublicSectionProps) {
  const steps = items(section.content);
  return (
    <PublicBand className="bg-[#f3fbfb]" id="clinic-process">
      <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Um percurso simples até à consulta",
          )}
          description={text(
            section.content,
            "text",
            "Sabe o que acontece depois de enviar o pedido, sem formulários clínicos desnecessários.",
          )}
        />
        <ol className="relative border-l border-teal-700/25 pl-8">
          {steps.slice(0, 4).map((item, index) => (
            <li
              className="relative pb-8 last:pb-0"
              data-clinic-reveal="step"
              key={index}
            >
              <span className="absolute -left-[49px] flex size-9 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white ring-8 ring-[#f3fbfb]">
                {index + 1}
              </span>
              <h3 className="text-xl font-black text-slate-950">
                {itemText(item, "title", "Etapa")}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
                {itemText(
                  item,
                  "description",
                  "A equipa orienta o próximo passo.",
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </PublicBand>
  );
}

export function ModernClinicDoctors({ section }: PublicSectionProps) {
  const doctors = items(section.content);
  return (
    <PublicBand className="bg-white" id="clinic-doctors">
      <SectionHeading
        title={text(section.content, "title", "Uma equipa que sabe ouvir")}
        description={text(
          section.content,
          "text",
          "Profissionais apresentados com clareza, experiência e proximidade.",
        )}
      />
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {doctors.map((doctor, index) => {
          const name = itemText(doctor, "name", "Profissional de saúde");
          const image = itemText(doctor, "image");
          return (
            <article
              className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-end"
              data-clinic-reveal="doctor"
              key={index}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-teal-50">
                <Image
                  alt={itemText(doctor, "imageAlt", name)}
                  className="object-cover"
                  fill
                  sizes="(min-width: 768px) 180px, 100vw"
                  src={image || fallbackHero}
                  style={{
                    objectPosition: itemText(doctor, "imagePosition", "center"),
                  }}
                  unoptimized
                />
              </div>
              <div className="pb-1">
                <p className="text-xs font-black tracking-[.18em] text-teal-700 uppercase">
                  {itemText(
                    doctor,
                    "specialty",
                    itemText(doctor, "role", "Especialista"),
                  )}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {itemText(
                    doctor,
                    "bio",
                    "Acompanhamento atento, com espaço para perguntas e decisões informadas.",
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function ModernClinicFacilities({ section }: PublicSectionProps) {
  const facilities = items(section.content);
  return (
    <PublicBand className="bg-slate-950 text-white" id="clinic-facilities">
      <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Um espaço pensado para chegar com tranquilidade",
          )}
          description={text(
            section.content,
            "text",
            "Ambientes, tecnologia e conforto apresentados sem excesso de promessa.",
          )}
          descriptionClassName="text-white/70"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {facilities.slice(0, 3).map((item, index) => (
            <article
              className={`relative overflow-hidden rounded-2xl bg-slate-800 ${index === 0 ? "aspect-[16/8] sm:col-span-2" : "aspect-[4/3]"}`}
              data-clinic-reveal="facility"
              key={index}
            >
              <Image
                alt={itemText(
                  item,
                  "imageAlt",
                  itemText(item, "title", "Espaço da clínica"),
                )}
                className="object-cover transition duration-700 hover:scale-105"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                src={itemText(item, "image", fallbackHero)}
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-5 pt-12">
                <h3 className="font-black">
                  {itemText(item, "title", "Espaço da clínica")}
                </h3>
                <p className="mt-1 text-sm text-white/75">
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

export function ClinicModernReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="clinic-modern-experience" data-clinic-modern>
      {children}
    </div>
  );
}
