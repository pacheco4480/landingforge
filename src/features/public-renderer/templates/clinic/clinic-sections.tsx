import Image from "next/image";
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import {
  isRecord,
  itemText,
  items,
  text,
} from "@/features/public-renderer/components/section-utils";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  clinicToneClasses,
  clinicVariant,
  clinicVariantLabel,
  recordArray,
} from "@/features/public-renderer/templates/clinic/clinic-utils";
import {
  ModernClinicDoctors,
  ModernClinicFacilities,
  ModernClinicHero as ModernClinicHeroEditorial,
  ModernClinicJourney,
  ModernClinicSpecialties,
} from "@/features/public-renderer/templates/clinic/clinic-modern";
import {
  LuxuryClinicDoctors,
  LuxuryClinicFacilities,
  LuxuryClinicHero as LuxuryClinicHeroEditorial,
  LuxuryClinicJourney,
  LuxuryClinicSpecialties,
} from "@/features/public-renderer/templates/clinic/clinic-luxury";

function brandKitText(content: unknown, key: string, fallback = "") {
  if (!isRecord(content) || !isRecord(content.brandKit)) return fallback;

  const value = content.brandKit[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function ClinicHeroSection({ context, section }: PublicSectionProps) {
  const variant = clinicVariant(context);
  const tone = clinicToneClasses(variant);
  const stats = recordArray(section.content, "stats");
  const heroImage = text(section.content, "heroImage");
  const heroImageAlt = text(
    section.content,
    "heroImageAlt",
    text(section.content, "headline", context.page.title),
  );

  if (variant === "modern") {
    return <ModernClinicHeroEditorial context={context} section={section} />;
  }

  if (variant === "luxury") {
    return <LuxuryClinicHeroEditorial context={context} section={section} />;
  }

  return (
    <PublicBand className="pt-10 sm:pt-16">
      <div className={`overflow-hidden rounded-md border ${tone.card}`}>
        <div
          className={`grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-12 ${tone.hero}`}
        >
          <div>
            <p
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase ${tone.badge}`}
            >
              {text(section.content, "eyebrow", clinicVariantLabel(variant))}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
              {text(section.content, "headline", context.page.title)}
            </h1>
            <p
              className={`mt-5 max-w-2xl text-base leading-8 sm:text-lg ${tone.muted}`}
            >
              {text(
                section.content,
                "subheadline",
                "Cuidados claros, equipa qualificada e marcação simples para cada paciente.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="public-button-primary" href="#booking">
                {text(section.content, "ctaPrimary", "Marcar consulta")}
              </a>
              <a className="public-button-outline" href="#clinic-specialties">
                {text(section.content, "ctaSecondary", "Ver especialidades")}
              </a>
            </div>
            {stats.length ? (
              <dl className="mt-10 grid gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <div
                    className="rounded-md border border-current/10 bg-white/10 p-4 backdrop-blur-sm"
                    key={index}
                  >
                    <dt className="text-xs font-bold tracking-wider uppercase opacity-70">
                      {itemText(stat, "label", "Indicador")}
                    </dt>
                    <dd className="mt-1 text-2xl font-black">
                      {itemText(stat, "value", "0")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-md bg-white/12">
            {heroImage ? (
              <Image
                alt={heroImageAlt}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                src={heroImage}
                unoptimized
              />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center bg-gradient-to-br from-[var(--public-primary)]/75 via-[var(--public-secondary)]/60 to-[var(--public-accent)]/55">
                <HeartPulse
                  aria-hidden="true"
                  className="size-20 text-white/80"
                />
              </div>
            )}
            <div className="absolute right-4 bottom-4 left-4 rounded-md bg-white/90 p-4 text-slate-950 shadow-xl backdrop-blur">
              <p className="text-xs font-black tracking-wider text-[var(--public-primary)] uppercase">
                {text(section.content, "proofLabel", "Consulta segura")}
              </p>
              <p className="mt-1 text-sm leading-6 font-semibold">
                {text(
                  section.content,
                  "proofText",
                  "Equipa credenciada, privacidade respeitada e resposta com próximos passos claros.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

// Legacy implementation retained temporarily for comparison during the rollout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LuxuryClinicHero({
  context,
  heroImage,
  heroImageAlt,
  section,
  stats,
}: {
  context: PublicSectionProps["context"];
  heroImage: string;
  heroImageAlt: string;
  section: PublicSectionProps["section"];
  stats: Record<string, unknown>[];
}) {
  return (
    <PublicBand className="overflow-hidden bg-[#f7f2ea] pt-8 sm:pt-14">
      <div className="relative overflow-hidden rounded-md bg-slate-950 text-white shadow-2xl ring-1 shadow-slate-950/25 ring-slate-900/10">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(192,132,252,0.18),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(212,175,55,0.16),transparent_28%)]"
        />
        <div className="relative grid min-h-[620px] lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-black tracking-[0.24em] text-[#f3dca4] uppercase backdrop-blur">
              <span className="h-px w-7 bg-[#f3dca4]" />
              {text(section.content, "eyebrow", "Private healthcare")}
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl leading-[1.02] font-black tracking-tight sm:text-6xl lg:text-[4.7rem]">
              {text(section.content, "headline", context.page.title)}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              {text(
                section.content,
                "subheadline",
                "Atendimento privado, discreto e conduzido por especialistas sénior.",
              )}
            </p>
            <div className="mt-7 max-w-2xl rounded-md border border-white/12 bg-white/7 p-4 backdrop-blur">
              <p className="text-[10px] font-black tracking-[0.22em] text-[#f3dca4] uppercase">
                Brand promise
              </p>
              <p className="mt-2 text-sm leading-6 font-semibold text-white/78">
                {brandKitText(
                  section.content,
                  "corePromise",
                  "Tempo protegido, escuta atenta e acompanhamento com total discrição.",
                )}
              </p>
              <p className="mt-2 text-xs font-bold tracking-wider text-white/40 uppercase">
                {brandKitText(
                  section.content,
                  "tagline",
                  "Private care, quietly handled.",
                )}
              </p>
            </div>
            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center rounded-md bg-[#f3dca4] px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                href="#booking"
              >
                {text(
                  section.content,
                  "ctaPrimary",
                  "Solicitar consulta privada",
                )}
              </a>
              <a
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                href="#private-experience"
              >
                {text(
                  section.content,
                  "ctaSecondary",
                  "Ver experiência privada",
                )}
              </a>
            </div>
            {stats.length ? (
              <dl className="mt-12 grid gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <div
                    className="rounded-md border border-white/10 bg-white/6 p-4 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                    key={index}
                  >
                    <dt className="text-[11px] font-black tracking-[0.2em] text-white/48 uppercase">
                      {itemText(stat, "label", "Indicador")}
                    </dt>
                    <dd className="mt-2 text-2xl font-black text-[#f3dca4]">
                      {itemText(stat, "value", "0")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="relative min-h-[420px] overflow-hidden lg:min-h-full">
            {heroImage ? (
              <Image
                alt={heroImageAlt}
                className="object-cover opacity-88"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={heroImage}
                unoptimized
              />
            ) : (
              <div className="h-full min-h-[420px] bg-gradient-to-br from-slate-800 via-slate-950 to-stone-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent lg:bg-gradient-to-r lg:from-slate-950/40 lg:via-transparent lg:to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 rounded-md border border-white/12 bg-slate-950/78 p-5 shadow-2xl backdrop-blur-md sm:left-auto sm:max-w-sm">
              <p className="text-xs font-black tracking-[0.22em] text-[#f3dca4] uppercase">
                {text(
                  section.content,
                  "proofLabel",
                  "Discrição em cada contacto",
                )}
              </p>
              <p className="mt-2 text-sm leading-6 font-semibold text-white/78">
                {text(
                  section.content,
                  "proofText",
                  "Pedidos privados são tratados com confirmação humana e apenas os dados essenciais no primeiro contacto.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

// Legacy implementation kept temporarily for comparison during the visual rollout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModernClinicHero({
  context,
  heroImage,
  heroImageAlt,
  section,
  stats,
}: {
  context: PublicSectionProps["context"];
  heroImage: string;
  heroImageAlt: string;
  section: PublicSectionProps["section"];
  stats: Record<string, unknown>[];
}) {
  return (
    <PublicBand className="overflow-hidden pt-8 sm:pt-14">
      <div className="relative overflow-hidden rounded-md bg-[#eefafa] p-5 shadow-2xl ring-1 shadow-teal-950/8 ring-teal-950/8 sm:p-8 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--public-secondary)]/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-[var(--public-accent)]/22 blur-3xl"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white/75 px-4 py-1.5 text-xs font-black tracking-widest text-[var(--public-primary)] uppercase shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.20)]" />
              {text(
                section.content,
                "eyebrow",
                "NexaCare — saúde simples e humana",
              )}
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl leading-[1.03] font-black tracking-tight text-slate-950 sm:text-6xl lg:text-[4.55rem]">
              {text(section.content, "headline", context.page.title)}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {text(
                section.content,
                "subheadline",
                "Uma clínica moderna com marcação simples, equipa humana e explicações claras antes de cada consulta.",
              )}
            </p>

            <div className="mt-7 max-w-2xl rounded-md border border-teal-950/10 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black tracking-widest text-[var(--public-primary)] uppercase">
                Brand promise
              </p>
              <p className="mt-2 text-sm leading-6 font-semibold text-slate-700">
                {brandKitText(
                  section.content,
                  "corePromise",
                  "Saúde privada simples, clara e humana antes da primeira consulta.",
                )}
              </p>
              <p className="mt-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                {brandKitText(
                  section.content,
                  "tagline",
                  "Saúde simples, humana e bem acompanhada.",
                )}
              </p>
            </div>

            <div className="mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
              {["Triagem humana", "Privacidade clara", "Marcação simples"].map(
                (label) => (
                  <div
                    className="flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 shadow-sm ring-1 ring-black/5"
                    key={label}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-[var(--public-primary)]"
                    />
                    <span>{label}</span>
                  </div>
                ),
              )}
            </div>

            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--public-primary)] px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-teal-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                href="#booking"
              >
                <span>
                  {text(section.content, "ctaPrimary", "Agendar consulta")}
                </span>
                <span aria-hidden="true">&rarr;</span>
              </a>
              <a
                className="inline-flex items-center justify-center rounded-md border border-teal-950/10 bg-white/80 px-7 py-3.5 text-sm font-black text-slate-950 shadow-sm backdrop-blur transition-all duration-300 hover:border-teal-950/20 hover:bg-white hover:shadow-md"
                href="#clinic-specialties"
              >
                {text(section.content, "ctaSecondary", "Conhecer tratamentos")}
              </a>
            </div>

            {stats.length ? (
              <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-teal-950/10 pt-7">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <dt className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                      {itemText(stat, "label", "Indicador")}
                    </dt>
                    <dd className="mt-1 text-2xl font-black tracking-tight text-[var(--public-primary)] sm:text-3xl">
                      {itemText(stat, "value", "0")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute top-8 -left-4 z-20 hidden max-w-60 rounded-md border border-white/80 bg-white/90 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Paciente informado
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                3 passos
              </p>
              <p className="mt-1 text-[11px] leading-normal font-semibold text-slate-500">
                Pedido, confirmação humana e consulta com próximos passos
                claros.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 z-20 hidden max-w-64 rounded-md bg-slate-950 p-4 text-white shadow-2xl transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-[10px] font-black tracking-wider text-emerald-300 uppercase">
                Dados protegidos
              </p>
              <p className="mt-1.5 text-xs leading-relaxed font-semibold text-slate-200">
                O primeiro contacto recolhe apenas informação essencial para a
                marcação.
              </p>
            </div>
            <div className="relative min-h-[420px] overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/5">
              {heroImage ? (
                <Image
                  alt={heroImageAlt}
                  className="object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  src={heroImage}
                  unoptimized
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center bg-gradient-to-br from-teal-700 via-sky-500 to-emerald-300">
                  <HeartPulse
                    aria-hidden="true"
                    className="size-20 text-white/80"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicBand>
  );
}

export function ClinicSpecialtiesSection({
  context,
  section,
}: PublicSectionProps) {
  if (clinicVariant(context) === "modern")
    return <ModernClinicSpecialties section={section} context={context} />;
  if (clinicVariant(context) === "luxury")
    return <LuxuryClinicSpecialties section={section} context={context} />;
  const list = items(section.content);
  const variant = clinicVariant(context);
  const isModern = variant === "modern";
  const isLuxury = variant === "luxury";

  return (
    <PublicBand
      id="clinic-specialties"
      className={isModern ? "bg-white" : isLuxury ? "bg-[#f7f2ea]" : undefined}
    >
      <div
        className={
          isModern || isLuxury
            ? "grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start"
            : ""
        }
      >
        <div>
          <SectionHeading
            title={text(
              section.content,
              "title",
              "Especialidades e tratamentos",
            )}
            description={text(
              section.content,
              "text",
              "Áreas de cuidado explicadas com linguagem simples, segura e orientada para a marcação.",
            )}
          />
          {isModern ? (
            <div className="mt-6 rounded-md bg-[#eefafa] p-5 text-sm leading-6 text-slate-600 ring-1 ring-teal-900/8">
              Cada área evita promessas médicas absolutas e orienta o paciente
              para uma conversa segura com a equipa.
            </div>
          ) : null}
          {isLuxury ? (
            <div className="mt-6 rounded-md border border-[#c6a766]/25 bg-white/70 p-5 text-sm leading-6 text-slate-600 shadow-sm">
              A experiência prioriza privacidade, tempo protegido e orientação
              sénior, sem promessas clínicas absolutas.
            </div>
          ) : null}
        </div>
        <div
          className={`grid gap-4 md:grid-cols-2 ${isModern || isLuxury ? "" : "mt-8 xl:grid-cols-3"}`}
        >
          {list.map((specialty, index) => (
            <article
              className={`group rounded-md border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isLuxury
                  ? "border-[#d8c28f]/35 bg-white/82"
                  : "border-slate-200/80 bg-white"
              } ${
                (isModern || isLuxury) && index === 0 ? "md:col-span-2" : ""
              } ${isModern && index === 0 ? "bg-[#f8fdfd]" : ""}`}
              key={index}
            >
              <div className="flex size-11 items-center justify-center rounded-md bg-[var(--public-primary)]/10 text-[var(--public-primary)]">
                {variant === "luxury" ? (
                  <Sparkles aria-hidden="true" className="size-5" />
                ) : (
                  <Stethoscope aria-hidden="true" className="size-5" />
                )}
              </div>
              <p className="mt-5 text-xs font-black tracking-wider text-[var(--public-primary)] uppercase">
                {itemText(specialty, "category", "Cuidado")}
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                {itemText(
                  specialty,
                  "name",
                  itemText(specialty, "title", "Especialidade"),
                )}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {itemText(
                  specialty,
                  "description",
                  "A equipa indica a especialidade adequada após avaliar o pedido.",
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                {itemText(specialty, "duration") ? (
                  <span>{itemText(specialty, "duration")}</span>
                ) : null}
                {itemText(specialty, "priceLabel") ? (
                  <span>{itemText(specialty, "priceLabel")}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function ClinicDoctorsSection({ context, section }: PublicSectionProps) {
  if (clinicVariant(context) === "modern")
    return <ModernClinicDoctors section={section} context={context} />;
  if (clinicVariant(context) === "luxury")
    return <LuxuryClinicDoctors section={section} context={context} />;
  const doctors = items(section.content);
  const variant = clinicVariant(context);
  const isModern = variant === "modern";
  const isLuxury = variant === "luxury";

  return (
    <PublicBand
      id="clinic-doctors"
      className={
        isModern
          ? "bg-[#f8fbfb]"
          : isLuxury
            ? "bg-slate-950 text-white"
            : undefined
      }
    >
      <SectionHeading
        title={text(section.content, "title", "Equipa clínica")}
        description={text(
          section.content,
          "text",
          "Perfis com experiência, proximidade e cuidado no acompanhamento.",
        )}
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {doctors.map((doctor, index) => {
          const image = itemText(doctor, "image");
          const name = itemText(doctor, "name", "Profissional de saúde");
          const imagePosition = itemText(doctor, "imagePosition", "center");

          return (
            <article
              className={`group overflow-hidden rounded-md border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                isLuxury
                  ? "border-white/10 bg-white/6"
                  : "border-slate-200/80 bg-white"
              }`}
              key={index}
            >
              <div className="relative min-h-72 bg-slate-100">
                {image ? (
                  <Image
                    alt={itemText(doctor, "imageAlt", name)}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    src={image}
                    style={{ objectPosition: imagePosition }}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-[var(--public-primary)] text-4xl font-black text-white">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs font-black tracking-widest text-[var(--public-primary)] uppercase">
                  {itemText(
                    doctor,
                    "specialty",
                    itemText(doctor, "role", "Clinico"),
                  )}
                </p>
                <h3
                  className={`mt-2 text-2xl font-black tracking-tight ${isLuxury ? "text-white" : "text-slate-950"}`}
                >
                  {name}
                </h3>
                <p
                  className={`mt-3 text-sm leading-6 ${isLuxury ? "text-white/68" : "text-slate-600"}`}
                >
                  {itemText(doctor, "bio", "")}
                </p>
                {itemText(doctor, "credentials") ? (
                  <p
                    className={`mt-4 text-xs leading-5 font-semibold ${isLuxury ? "text-white/48" : "text-slate-500"}`}
                  >
                    {itemText(doctor, "credentials")}
                  </p>
                ) : null}
                {isModern || isLuxury ? (
                  <div
                    className={`mt-5 flex flex-wrap gap-2 text-xs font-bold ${isLuxury ? "text-[#f3dca4]" : "text-slate-500"}`}
                  >
                    {itemText(doctor, "languages") ? (
                      <span>{itemText(doctor, "languages")}</span>
                    ) : null}
                    {itemText(doctor, "availability") ? (
                      <span>{itemText(doctor, "availability")}</span>
                    ) : null}
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

export function ClinicCredentialsSection({
  context,
  section,
}: PublicSectionProps) {
  const credentials = items(section.content);
  const variant = clinicVariant(context);
  const isModern = variant === "modern";
  const isLuxury = variant === "luxury";

  return (
    <PublicBand
      id="clinic-credentials"
      className={isLuxury ? "bg-[#f7f2ea]" : undefined}
    >
      <div
        className={`rounded-md p-6 sm:p-10 ${
          isLuxury
            ? "bg-slate-950 text-white shadow-2xl shadow-slate-950/18"
            : isModern
              ? "bg-[#eefafa]"
              : "bg-[var(--public-surface)]"
        }`}
      >
        <SectionHeading
          title={text(
            section.content,
            "title",
            "Credenciais que reduzem incerteza",
          )}
          description={text(
            section.content,
            "text",
            "Certificações, experiência e práticas que ajudam cada paciente a sentir-se acompanhado.",
          )}
        />
        <div
          className={`mt-8 grid gap-4 ${isLuxury ? "md:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4"}`}
        >
          {credentials.map((credential, index) => (
            <article
              className={`rounded-md p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
                isLuxury
                  ? "border border-white/10 bg-white/7 ring-1 ring-white/5"
                  : "bg-white ring-1 ring-black/5"
              }`}
              key={index}
            >
              <ShieldCheck
                aria-hidden="true"
                className={`size-6 ${isLuxury ? "text-[#f3dca4]" : "text-[var(--public-primary)]"}`}
              />
              <h3
                className={`mt-4 font-black ${isLuxury ? "text-white" : "text-slate-950"}`}
              >
                {itemText(
                  credential,
                  "title",
                  itemText(credential, "name", "Credencial"),
                )}
              </h3>
              <p
                className={`mt-2 text-sm leading-6 ${isLuxury ? "text-white/62" : "text-slate-600"}`}
              >
                {itemText(credential, "description", "")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function ClinicPatientJourneySection({
  context,
  section,
}: PublicSectionProps) {
  if (clinicVariant(context) === "modern")
    return <ModernClinicJourney section={section} context={context} />;
  if (clinicVariant(context) === "luxury")
    return <LuxuryClinicJourney section={section} context={context} />;
  const steps = items(section.content);
  const variant = clinicVariant(context);
  const isModern = variant === "modern";
  const isLuxury = variant === "luxury";

  return (
    <PublicBand
      id="clinic-process"
      className={
        isModern ? "bg-white" : isLuxury ? "bg-slate-950 text-white" : undefined
      }
    >
      <div
        className={
          isModern
            ? "grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"
            : ""
        }
      >
        <SectionHeading
          title={text(section.content, "title", "Como funciona a marcação")}
          description={text(
            section.content,
            "text",
            "Um percurso simples para saber o que acontece depois de enviar o pedido.",
          )}
        />
        <div
          className={`mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${
            isModern ? "mt-0 xl:grid-cols-2" : ""
          } ${isLuxury ? "xl:grid-cols-4" : ""}`}
        >
          {steps.map((step, index) => (
            <article
              className={`relative overflow-hidden rounded-md p-6 transition-all duration-300 hover:-translate-y-1 ${
                isLuxury
                  ? "border border-white/10 bg-white/6 shadow-sm"
                  : isModern
                    ? "border border-teal-900/8 bg-[#f3fbfb] shadow-sm"
                    : "border border-slate-200 bg-white shadow-sm"
              }`}
              key={index}
            >
              <span
                className={`inline-flex size-10 items-center justify-center rounded-md text-sm font-black ${
                  isLuxury
                    ? "bg-[#f3dca4] text-slate-950"
                    : "bg-[var(--public-primary)] text-white"
                }`}
              >
                {index + 1}
              </span>
              <h3
                className={`mt-5 text-lg font-black ${isLuxury ? "text-white" : "text-slate-950"}`}
              >
                {itemText(step, "title", "Etapa")}
              </h3>
              <p
                className={`mt-2 text-sm leading-6 ${isLuxury ? "text-white/62" : "text-slate-600"}`}
              >
                {itemText(step, "description", "")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </PublicBand>
  );
}

export function ClinicFacilitiesSection({
  context,
  section,
}: PublicSectionProps) {
  if (clinicVariant(context) === "modern")
    return <ModernClinicFacilities section={section} context={context} />;
  if (clinicVariant(context) === "luxury")
    return <LuxuryClinicFacilities section={section} context={context} />;
  const facilities = items(section.content);
  const isLuxury = clinicVariant(context) === "luxury";

  return (
    <PublicBand
      id="clinic-facilities"
      className={isLuxury ? "bg-[#f7f2ea]" : undefined}
    >
      <SectionHeading
        title={text(section.content, "title", "Espaco preparado para cuidar")}
        description={text(
          section.content,
          "text",
          "Instalações, tecnologia e conforto apresentados sem exagero comercial.",
        )}
      />
      <div
        className={`mt-8 grid gap-4 ${isLuxury ? "lg:grid-cols-[1.15fr_0.85fr_0.85fr]" : "lg:grid-cols-3"}`}
      >
        {facilities.map((facility, index) => {
          const facilityImage = itemText(facility, "image");
          const facilityTitle = itemText(facility, "title", "Instalacao");

          return (
            <article
              className={`rounded-md border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isLuxury
                  ? `overflow-hidden border-[#d8c28f]/35 bg-white/82 ${index === 0 ? "lg:min-h-56 lg:p-8" : ""}`
                  : "border-slate-200 bg-white"
              }`}
              key={index}
            >
              {facilityImage ? (
                <div
                  className={`${isLuxury && index === 0 ? "-mx-8 -mt-8" : "-mx-5 -mt-5"} mb-5`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-slate-100">
                    <Image
                      alt={itemText(facility, "imageAlt", facilityTitle)}
                      className="object-cover transition duration-700 hover:scale-[1.03]"
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                      src={facilityImage}
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}
              <h3 className="text-lg font-black text-slate-950">
                {facilityTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {itemText(facility, "description", "")}
              </p>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function ClinicLocationsSection({ section }: PublicSectionProps) {
  const locations = items(section.content);

  return (
    <PublicBand id="clinic-locations">
      <SectionHeading
        title={text(section.content, "title", "Localização e horários")}
        description={text(
          section.content,
          "text",
          "Detalhes práticos para marcar, chegar e preparar a consulta com tranquilidade.",
        )}
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {locations.map((location, index) => {
          const address = itemText(
            location,
            "address",
            "Morada confirmada pela equipa",
          );
          const mapQuery = itemText(location, "mapQuery", address);

          return (
            <article
              className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
              key={index}
            >
              {mapQuery ? (
                <a
                  aria-label={`Abrir direções para ${address} no Google Maps`}
                  className="group flex h-64 flex-col justify-between bg-[radial-gradient(circle_at_82%_18%,rgba(13,148,136,0.18),transparent_32%),linear-gradient(135deg,#ecfdf5,#f8fafc)] p-6 text-slate-900 transition hover:shadow-inner focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--public-primary)]"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-[var(--public-primary)] shadow-sm">
                    <MapPin aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Como chegar
                    </span>
                    <span className="mt-2 block max-w-sm text-lg font-bold leading-6">
                      {address}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-primary)]">
                      Abrir direções no Google Maps
                      <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </a>
              ) : null}
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-950">
                  {itemText(location, "name", "Clínica")}
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p className="flex gap-2">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[var(--public-primary)]"
                    />
                    <span>{address}</span>
                  </p>
                  <p className="flex gap-2">
                    <Clock
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[var(--public-primary)]"
                    />
                    <span>
                      {itemText(
                        location,
                        "openingHours",
                        "Horário confirmado pela equipa",
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </PublicBand>
  );
}

export function ClinicBookingSection({ context, section }: PublicSectionProps) {
  const variant = clinicVariant(context);
  const isModern = variant === "modern";
  const isLuxury = variant === "luxury";

  return (
    <PublicBand id="booking" className={isLuxury ? "bg-[#f7f2ea]" : undefined}>
      <div
        className={`grid gap-6 rounded-md p-6 text-white sm:p-10 ${
          isLuxury
            ? "bg-slate-950 shadow-2xl shadow-slate-950/18 lg:grid-cols-[1.1fr_0.9fr]"
            : isModern
              ? "bg-gradient-to-br from-[var(--public-primary)] via-teal-700 to-slate-950 lg:grid-cols-[0.86fr_1.14fr]"
              : "bg-[var(--public-primary)] lg:grid-cols-[0.92fr_1.08fr]"
        }`}
      >
        <div>
          <CalendarCheck
            aria-hidden="true"
            className={`size-9 ${isLuxury ? "text-[#f3dca4]" : "text-white/80"}`}
          />
          <h2 className="mt-5 text-3xl leading-tight font-black">
            {text(
              section.content,
              "headline",
              "Marque uma consulta com segurança",
            )}
          </h2>
          <p className="mt-3 leading-7 text-white/78">
            {text(
              section.content,
              "text",
              "Envie os seus dados de contacto e a equipa confirma disponibilidade. Não recolhemos histórico médico detalhado neste primeiro pedido.",
            )}
          </p>
        </div>
        <div
          className={`rounded-md p-5 ring-1 ${
            isLuxury
              ? "bg-white/7 ring-white/12"
              : isModern
                ? "bg-white/12 ring-white/18"
                : "bg-white/10 ring-white/15"
          }`}
        >
          <h3 className="font-black">
            {text(section.content, "privacyTitle", "Privacidade primeiro")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/74">
            {text(
              section.content,
              "privacyText",
              "Use este primeiro pedido apenas para contacto ou marcação. Dados clínicos devem ser tratados em canais apropriados da clínica.",
            )}
          </p>
          <a
            className={`mt-5 inline-flex rounded-md px-5 py-3 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 ${
              isLuxury
                ? "bg-[#f3dca4] text-slate-950 hover:bg-white"
                : "bg-white text-[var(--public-primary)]"
            }`}
            href="#contact"
          >
            {text(section.content, "ctaPrimary", "Preencher pedido")}
          </a>
        </div>
      </div>
    </PublicBand>
  );
}

export function ClinicPrivateExperienceSection({
  section,
}: PublicSectionProps) {
  const itemsList = items(section.content);

  return (
    <PublicBand id="private-experience">
      <div className="relative overflow-hidden rounded-md bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-10 lg:p-14">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_30%,rgba(243,220,164,0.16),transparent_34%)]"
        />
        <div className="relative grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <SectionHeading
            title={text(
              section.content,
              "title",
              "Atendimento privado e personalizado",
            )}
            description={text(
              section.content,
              "text",
              "Uma experiência discreta para pacientes que valorizam privacidade, tempo e acompanhamento especializado.",
            )}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {itemsList.map((item, index) => (
              <article
                className={`rounded-md border border-white/10 bg-white/8 p-5 transition-all duration-300 hover:-translate-y-1 ${
                  index === 0 ? "md:col-span-3 lg:col-span-1" : ""
                }`}
                key={index}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="size-5 text-[#f3dca4]"
                />
                <h3 className="mt-4 font-black">
                  {itemText(item, "title", "Beneficio")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {itemText(item, "description", "")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PublicBand>
  );
}
