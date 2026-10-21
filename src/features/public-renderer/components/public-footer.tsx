import type { PublicHeaderProfile } from "@/features/public-renderer/components/public-header";
import { cn } from "@/lib/utils";

export type PublicFooterVariant =
  | "simple"
  | "classic"
  | "premium"
  | "editorial"
  | "cta-focused"
  | "local-business"
  | "minimal-legal"
  | "playful"
  | "luxury";

export type PublicFooterProfile = PublicHeaderProfile;

export type PublicFooterLink = {
  href: string;
  label: string;
};

export type PublicFooterBrand = {
  businessName: string;
  contactEmail: string;
  location: string;
  phone: string;
};

export function PublicFooter({
  brand,
  cta,
  legalLinks,
  links,
  profile,
  variant,
}: {
  brand: PublicFooterBrand;
  cta: PublicFooterLink | null;
  legalLinks: PublicFooterLink[];
  links: PublicFooterLink[];
  profile?: PublicFooterProfile;
  variant: PublicFooterVariant;
}) {
  const variantClasses = footerVariantClasses[variant];
  const profileClasses = profile ? footerProfileClasses[profile] : undefined;
  const classes = {
    bottom: cn(variantClasses.bottom, profileClasses?.bottom),
    brandBlock: cn(variantClasses.brandBlock, profileClasses?.brandBlock),
    brandName: cn(variantClasses.brandName, profileClasses?.brandName),
    cta: cn(variantClasses.cta, profileClasses?.cta),
    footer: cn(variantClasses.footer, profileClasses?.footer),
    inner: cn(variantClasses.inner, profileClasses?.inner),
    legal: cn(variantClasses.legal, profileClasses?.legal),
    legalLink: cn(variantClasses.legalLink, profileClasses?.legalLink),
    link: cn(variantClasses.link, profileClasses?.link),
    meta: cn(variantClasses.meta, profileClasses?.meta),
    navigation: cn(variantClasses.navigation, profileClasses?.navigation),
    top: cn(variantClasses.top, profileClasses?.top),
  };
  const hasLinks = links.length > 0;

  return (
    <footer className={classes.footer} data-public-profile={profile}>
      <div className={classes.inner}>
        <div className={classes.top}>
          <div className={classes.brandBlock}>
            <p className={classes.brandName}>{brand.businessName}</p>
            <div className={classes.meta}>
              {brand.contactEmail ? <span>{brand.contactEmail}</span> : null}
              {brand.phone ? <span>{brand.phone}</span> : null}
              {brand.location ? <span>{brand.location}</span> : null}
            </div>
          </div>

          {cta ? (
            <a className={classes.cta} href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </div>

        {hasLinks ? (
          <nav aria-label="Navegacao de rodape" className={classes.navigation}>
            {links.map((link) => (
              <a
                className={classes.link}
                href={link.href}
                key={`${link.href}-${link.label}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className={classes.bottom}>
          <span>
            {new Date().getFullYear()} {brand.businessName}
          </span>
          <nav aria-label="Legal" className={classes.legal}>
            {legalLinks.map((link) => (
              <a
                className={classes.legalLink}
                href={link.href}
                key={`${link.href}-${link.label}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

const baseFooter = "border-t";
const baseInner = "mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8";
const baseTop =
  "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between";
const baseMeta = "mt-3 flex flex-col gap-1 text-sm";
const baseNavigation =
  "mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold";
const baseBottom =
  "mt-8 flex flex-col gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between";
const baseLegal = "flex flex-wrap gap-x-5 gap-y-2";
const baseFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2";
const baseCta =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-all";

const lightLink = `${baseFocus} text-[var(--public-muted)] transition-colors hover:text-[var(--public-primary)]`;
const lightCta = `${baseCta} ${baseFocus} border border-[var(--public-primary)]/30 text-[var(--public-primary)] hover:bg-[var(--public-primary)] hover:text-white`;
const solidCta = `${baseCta} ${baseFocus} bg-[var(--public-primary)] text-white shadow-sm shadow-slate-950/10 hover:-translate-y-0.5 hover:shadow-md`;
const darkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
const darkLink = `${darkFocus} text-white/68 transition-colors hover:text-white`;

const footerVariantClasses: Record<
  PublicFooterVariant,
  {
    bottom: string;
    brandBlock: string;
    brandName: string;
    cta: string;
    footer: string;
    inner: string;
    legal: string;
    legalLink: string;
    link: string;
    meta: string;
    navigation: string;
    top: string;
  }
> = {
  simple: {
    footer: `${baseFooter} border-black/10 bg-[var(--public-background)]`,
    inner: `${baseInner} py-8`,
    top: baseTop,
    brandBlock: "",
    brandName: "text-base font-bold text-[var(--public-text)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: lightCta,
    navigation: baseNavigation,
    link: lightLink,
    bottom: `${baseBottom} border-black/10 text-[var(--public-muted)]`,
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  classic: {
    footer: `${baseFooter} border-black/10 bg-[var(--public-surface)]`,
    inner: baseInner,
    top: baseTop,
    brandBlock: "",
    brandName: "text-lg font-extrabold text-[var(--public-text)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: solidCta,
    navigation: baseNavigation,
    link: lightLink,
    bottom: `${baseBottom} border-black/10 text-[var(--public-muted)]`,
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  premium: {
    footer: `${baseFooter} border-slate-950/10 bg-[#f4f1ec] text-slate-950`,
    inner: `${baseInner} py-12`,
    top: baseTop,
    brandBlock: "max-w-xl",
    brandName: "text-2xl font-black tracking-tight text-slate-950",
    meta: `${baseMeta} text-slate-600`,
    cta: `${baseCta} ${baseFocus} bg-slate-950 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg`,
    navigation: `${baseNavigation} uppercase tracking-[0.14em] text-[11px]`,
    link: "text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
    bottom: `${baseBottom} border-slate-950/10 text-slate-500`,
    legal: baseLegal,
    legalLink:
      "text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
  },
  editorial: {
    footer: `${baseFooter} border-black/10 bg-white text-slate-950`,
    inner: `${baseInner} py-12`,
    top: `${baseTop} border-b border-black/10 pb-8`,
    brandBlock: "max-w-2xl",
    brandName: "font-serif text-2xl font-bold tracking-tight",
    meta: `${baseMeta} text-slate-500`,
    cta: `${baseCta} border border-slate-950 text-slate-950 transition-colors hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2`,
    navigation: `${baseNavigation} font-serif text-base`,
    link: "text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
    bottom:
      "mt-8 flex flex-col gap-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between",
    legal: baseLegal,
    legalLink:
      "text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
  },
  "cta-focused": {
    footer: `${baseFooter} border-black/10 bg-[var(--public-background)]`,
    inner: baseInner,
    top: `${baseTop} rounded-md border border-black/10 bg-[var(--public-surface)] p-5`,
    brandBlock: "max-w-xl",
    brandName: "text-xl font-extrabold text-[var(--public-text)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: solidCta,
    navigation: baseNavigation,
    link: lightLink,
    bottom: `${baseBottom} border-black/10 text-[var(--public-muted)]`,
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  "local-business": {
    footer: `${baseFooter} border-black/10 bg-white`,
    inner: baseInner,
    top: baseTop,
    brandBlock: "max-w-xl",
    brandName: "text-xl font-black text-[var(--public-primary)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: `${baseCta} ${baseFocus} bg-[var(--public-accent)] text-slate-950 shadow-sm hover:-translate-y-0.5 hover:shadow-md`,
    navigation: baseNavigation,
    link: lightLink,
    bottom: `${baseBottom} border-black/10 text-[var(--public-muted)]`,
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  "minimal-legal": {
    footer: `${baseFooter} border-black/5 bg-[var(--public-background)]`,
    inner: `${baseInner} py-6`,
    top: "hidden",
    brandBlock: "",
    brandName: "",
    meta: "",
    cta: "",
    navigation: "hidden",
    link: "",
    bottom:
      "flex flex-col gap-3 text-xs text-[var(--public-muted)] sm:flex-row sm:items-center sm:justify-between",
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  playful: {
    footer: `${baseFooter} border-black/10 bg-[var(--public-background)]`,
    inner: baseInner,
    top: baseTop,
    brandBlock: "max-w-xl",
    brandName: "text-2xl font-black tracking-tight text-[var(--public-text)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: `${baseCta} ${baseFocus} rounded-full bg-[var(--public-accent)] text-slate-950 shadow-sm hover:-translate-y-0.5 hover:shadow-md`,
    navigation: baseNavigation,
    link: `${baseFocus} rounded-full px-3 py-1.5 text-[var(--public-muted)] transition-colors hover:bg-[var(--public-accent)]/20 hover:text-[var(--public-primary)]`,
    bottom: `${baseBottom} border-black/10 text-[var(--public-muted)]`,
    legal: baseLegal,
    legalLink: `${lightLink} underline-offset-4 hover:underline`,
  },
  luxury: {
    footer: `${baseFooter} border-white/10 bg-slate-950 text-white`,
    inner: `${baseInner} py-12`,
    top: baseTop,
    brandBlock: "max-w-xl",
    brandName: "font-serif text-2xl font-semibold tracking-wide text-white",
    meta: `${baseMeta} text-white/62`,
    cta: `${baseCta} ${darkFocus} border border-[var(--public-accent)]/70 text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-slate-950`,
    navigation: `${baseNavigation} uppercase tracking-[0.18em] text-[11px]`,
    link: darkLink,
    bottom: `${baseBottom} border-white/10 text-white/52`,
    legal: baseLegal,
    legalLink: `${darkLink} underline-offset-4 hover:underline`,
  },
};

const footerProfileClasses: Record<
  PublicFooterProfile,
  Partial<(typeof footerVariantClasses)[PublicFooterVariant]>
> = {
  "real-estate-local": {
    footer: "border-t-2 border-[var(--public-primary)]/20 bg-[#f2f5f0]",
    inner: `${baseInner} max-w-[1360px] py-12`,
    top: `${baseTop} border-b border-[var(--public-primary)]/15 pb-8`,
    brandName: "text-xl font-extrabold text-[var(--public-primary)]",
    meta: `${baseMeta} text-[var(--public-muted)]`,
    cta: `${baseCta} ${baseFocus} bg-[var(--public-accent)] text-slate-950 shadow-[0_3px_0_rgba(25,35,30,0.12)]`,
    navigation: `${baseNavigation} mt-6`,
  },
  "real-estate-premium": {
    footer:
      "border-t border-[var(--public-accent)]/35 bg-[var(--public-primary)] text-white",
    inner: `${baseInner} max-w-[1440px] pt-20 pb-16 lg:px-12`,
    top: `${baseTop} border-b border-white/15 pb-9`,
    brandName: "font-serif text-3xl font-medium text-white",
    meta: `${baseMeta} text-white/70`,
    cta: `${baseCta} ${darkFocus} border border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-[var(--public-primary)]`,
    navigation: `${baseNavigation} mt-7 text-[11px] uppercase tracking-[0.12em]`,
    link: "text-white/70 transition-colors hover:text-[var(--public-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]",
    bottom: `${baseBottom} border-white/15 text-white/55`,
    legalLink:
      "text-white/55 underline-offset-4 hover:text-[var(--public-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]",
  },
  "clinic-modern": {
    footer:
      "border-t border-[var(--public-primary)]/15 bg-[var(--public-surface)]",
    inner: `${baseInner} max-w-[1320px] py-10`,
    top: `${baseTop} items-center border-b border-[var(--public-primary)]/15 pb-7`,
    brandName: "text-xl font-bold text-[var(--public-primary)]",
    meta: `${baseMeta} text-[var(--public-muted)] sm:flex-row sm:flex-wrap sm:gap-x-5`,
    cta: "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--public-primary)] px-5 text-sm font-bold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2",
    navigation: `${baseNavigation} mt-6`,
    link: "text-[var(--public-muted)] transition-colors hover:text-[var(--public-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)]",
    bottom: `${baseBottom} border-[var(--public-primary)]/15 text-[var(--public-muted)]`,
    legalLink:
      "text-[var(--public-muted)] underline-offset-4 hover:text-[var(--public-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)]",
  },
  "clinic-luxury": {
    footer:
      "border-t border-[var(--public-accent)]/35 bg-[var(--public-primary)] text-white",
    inner: `${baseInner} max-w-[1400px] pt-20 pb-16 px-6 lg:px-12`,
    top: `${baseTop} border-b border-[var(--public-accent)]/20 pb-9`,
    brandName: "font-serif text-3xl font-medium text-white",
    meta: `${baseMeta} text-white/65`,
    cta: `${baseCta} ${darkFocus} border border-[var(--public-accent)]/60 text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-[var(--public-primary)]`,
    navigation: `${baseNavigation} mt-7 text-[10px] uppercase tracking-[0.16em]`,
    link: `${darkLink} text-white/70 hover:text-[var(--public-accent)]`,
    bottom: `${baseBottom} border-[var(--public-accent)]/20 text-white/50`,
    legalLink: `${darkLink} text-white/55 hover:text-[var(--public-accent)]`,
  },
  "restaurant-fine-dining": {
    footer:
      "border-t border-[var(--public-accent)]/40 bg-[var(--public-primary)] text-white",
    inner: `${baseInner} max-w-[1440px] py-16 lg:px-14`,
    top: `${baseTop} items-end border-b border-[var(--public-accent)]/30 pb-10`,
    brandName: "font-serif text-4xl font-medium tracking-[0.02em] text-white",
    meta: `${baseMeta} text-white/70 sm:flex-row sm:flex-wrap sm:gap-x-6`,
    cta: `${baseCta} ${darkFocus} border border-[var(--public-accent)]/70 px-6 text-[10px] uppercase tracking-[0.18em] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-[var(--public-primary)]`,
    navigation: `${baseNavigation} mt-8 text-[10px] uppercase tracking-[0.2em]`,
    link: `${darkLink} text-white/75 hover:text-[var(--public-accent)]`,
    bottom: `${baseBottom} border-[var(--public-accent)]/25 text-white/55`,
    legalLink: `${darkLink} text-white/55 hover:text-[var(--public-accent)]`,
  },
  "restaurant-playful": {
    footer:
      "border-t-[4px] border-[var(--public-primary)] bg-[var(--public-accent)] text-[var(--public-text)]",
    inner: `${baseInner} max-w-[1360px] py-12`,
    top: `${baseTop} rounded-2xl border-2 border-[var(--public-primary)]/15 bg-[var(--public-background)]/70 p-6 sm:p-8`,
    brandName: "text-3xl font-black text-[var(--public-text)]",
    meta: `${baseMeta} text-[var(--public-muted)] sm:flex-row sm:flex-wrap sm:gap-x-5`,
    cta: `${baseCta} ${baseFocus} rounded-full bg-[var(--public-primary)] px-6 text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]`,
    navigation: `${baseNavigation} mt-7`,
    link: "rounded-full px-3 py-2 font-bold text-[var(--public-text)] transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)]",
    bottom: `${baseBottom} border-[var(--public-primary)]/20 text-[var(--public-muted)]`,
    legalLink: `${baseFocus} text-[var(--public-muted)] underline-offset-4 hover:text-[var(--public-text)] hover:underline`,
  },
  "bakery-playful": {
    footer:
      "border-t border-[var(--public-primary)]/20 bg-[var(--public-surface)] text-[var(--public-text)]",
    inner: `${baseInner} max-w-[1320px] py-12`,
    top: `${baseTop} border-b border-[var(--public-primary)]/20 pb-8`,
    brandName: "font-serif text-3xl font-bold text-[var(--public-primary)]",
    meta: `${baseMeta} text-[var(--public-muted)] sm:flex-row sm:flex-wrap sm:gap-x-5`,
    cta: `${baseCta} ${baseFocus} rounded-md bg-[var(--public-primary)] px-5 text-white shadow-[0_3px_0_rgba(0,0,0,0.16)]`,
    navigation: `${baseNavigation} mt-6`,
    link: "rounded-md px-2 py-1 text-[var(--public-muted)] transition-colors hover:bg-[var(--public-background)] hover:text-[var(--public-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)]",
    bottom: `${baseBottom} border-[var(--public-primary)]/20 text-[var(--public-muted)]`,
    legalLink: `${baseFocus} text-[var(--public-muted)] underline-offset-4 hover:text-[var(--public-primary)] hover:underline`,
  },
  "gym-modern": {
    footer: "border-t border-white/10 bg-[var(--public-primary)] text-white",
    inner: `${baseInner} max-w-[1400px] py-12 px-5 lg:px-10`,
    top: `${baseTop} items-end border-b border-white/12 pb-8`,
    brandName: "text-2xl font-black uppercase tracking-[0.06em] text-white",
    meta: `${baseMeta} text-white/55 sm:flex-row sm:flex-wrap sm:gap-x-6`,
    cta: "inline-flex min-h-11 items-center justify-center bg-[var(--public-accent)] px-5 text-xs font-black uppercase tracking-[0.08em] text-[var(--public-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--public-primary)]",
    navigation: `${baseNavigation} mt-7 text-xs uppercase tracking-[0.1em]`,
    link: "text-white/60 transition-colors hover:text-[var(--public-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]",
    bottom: `${baseBottom} border-white/10 text-white/45`,
    legalLink:
      "text-white/45 underline-offset-4 hover:text-[var(--public-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]",
  },
};
