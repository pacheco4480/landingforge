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
  variant,
}: {
  brand: PublicFooterBrand;
  cta: PublicFooterLink | null;
  legalLinks: PublicFooterLink[];
  links: PublicFooterLink[];
  variant: PublicFooterVariant;
}) {
  const classes = footerVariantClasses[variant];
  const hasLinks = links.length > 0;

  return (
    <footer className={classes.footer}>
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
          <nav
            aria-label="Navegacao de rodape"
            className={classes.navigation}
          >
            {links.map((link) => (
              <a className={classes.link} href={link.href} key={`${link.href}-${link.label}`}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className={classes.bottom}>
          <span>{new Date().getFullYear()} {brand.businessName}</span>
          <nav aria-label="Legal" className={classes.legal}>
            {legalLinks.map((link) => (
              <a className={classes.legalLink} href={link.href} key={`${link.href}-${link.label}`}>
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
const baseTop = "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between";
const baseMeta = "mt-3 flex flex-col gap-1 text-sm";
const baseNavigation = "mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold";
const baseBottom =
  "mt-8 flex flex-col gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between";
const baseLegal = "flex flex-wrap gap-x-5 gap-y-2";
const baseFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2";
const baseCta =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-all";

const lightLink =
  `${baseFocus} text-[var(--public-muted)] transition-colors hover:text-[var(--public-primary)]`;
const lightCta =
  `${baseCta} ${baseFocus} border border-[var(--public-primary)]/30 text-[var(--public-primary)] hover:bg-[var(--public-primary)] hover:text-white`;
const solidCta =
  `${baseCta} ${baseFocus} bg-[var(--public-primary)] text-white shadow-sm shadow-slate-950/10 hover:-translate-y-0.5 hover:shadow-md`;
const darkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
const darkLink =
  `${darkFocus} text-white/68 transition-colors hover:text-white`;

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
    legalLink: "text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
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
    bottom: "mt-8 flex flex-col gap-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between",
    legal: baseLegal,
    legalLink: "text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
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
    bottom: "flex flex-col gap-3 text-xs text-[var(--public-muted)] sm:flex-row sm:items-center sm:justify-between",
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
