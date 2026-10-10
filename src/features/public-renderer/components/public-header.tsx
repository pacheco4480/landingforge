"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { PublicBrand } from "@/features/public-renderer/components/public-brand";

export type PublicHeaderVariant =
  | "classic"
  | "minimal"
  | "premium"
  | "transparent"
  | "centered"
  | "cta-focused"
  | "editorial"
  | "local-business"
  | "playful"
  | "luxury";

export type PublicHeaderLink = {
  href: string;
  label: string;
};

export type PublicHeaderBrand = {
  businessName: string;
  logoAltText: string;
  logoUrl: string;
};

export function PublicHeader({
  brand,
  cta,
  links,
  variant,
}: {
  brand: PublicHeaderBrand;
  cta: PublicHeaderLink;
  links: PublicHeaderLink[];
  variant: PublicHeaderVariant;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const classes = headerVariantClasses[variant];
  const mobileMenuId = "public-mobile-navigation";

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <a className={classes.brand} href="#">
          <PublicBrand
            altText={brand.logoAltText}
            businessName={brand.businessName}
            logoUrl={brand.logoUrl}
          />
        </a>

        <nav
          aria-label="Navegacao principal"
          className={classes.desktopNav}
        >
          {links.map((link) => (
            <a className={classes.navLink} href={link.href} key={`${link.href}-${link.label}`}>
              {link.label}
            </a>
          ))}
          <a className={classes.cta} href={cta.href}>
            {cta.label}
          </a>
        </nav>

        <button
          aria-controls={mobileMenuId}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          className={classes.menuButton}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
      </div>

      {isOpen ? (
        <nav
          aria-label="Navegacao principal mobile"
          className={classes.mobileNav}
          id={mobileMenuId}
        >
          {links.map((link) => (
            <a
              className={classes.mobileLink}
              href={link.href}
              key={`${link.href}-${link.label}`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            className={classes.mobileCta}
            href={cta.href}
            onClick={() => setIsOpen(false)}
          >
            {cta.label}
          </a>
        </nav>
      ) : null}
    </header>
  );
}

const baseHeader =
  "sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-90";
const baseInner =
  "mx-auto flex min-h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8";
const baseDesktopNav = "hidden items-center gap-5 text-sm font-semibold md:flex";
const baseMenuButton =
  "inline-flex size-10 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2 md:hidden";
const baseMobileNav =
  "mx-auto grid w-full max-w-7xl gap-2 border-t px-4 py-4 text-sm font-semibold sm:px-6 lg:px-8 md:hidden";
const baseMobileLink =
  "rounded-md px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)]";
const baseCta =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2";

const lightNavLink =
  "text-[var(--public-muted)] transition-colors hover:text-[var(--public-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2";
const lightCta =
  `${baseCta} border border-[var(--public-primary)]/30 text-[var(--public-primary)] hover:bg-[var(--public-primary)] hover:text-white`;
const solidCta =
  `${baseCta} bg-[var(--public-primary)] text-white shadow-sm shadow-slate-950/10 hover:-translate-y-0.5 hover:shadow-md`;
const darkNavLink =
  "text-white/72 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const headerVariantClasses: Record<
  PublicHeaderVariant,
  {
    brand: string;
    cta: string;
    desktopNav: string;
    header: string;
    inner: string;
    menuButton: string;
    mobileCta: string;
    mobileLink: string;
    mobileNav: string;
    navLink: string;
  }
> = {
  classic: {
    header: `${baseHeader} border-black/10 bg-[var(--public-background)]/95`,
    inner: `${baseInner} justify-between`,
    brand: "font-semibold",
    desktopNav: baseDesktopNav,
    navLink: lightNavLink,
    cta: lightCta,
    menuButton: `${baseMenuButton} border-black/10 bg-white/60 text-[var(--public-text)] hover:bg-white`,
    mobileNav: `${baseMobileNav} border-black/10 bg-[var(--public-background)]/98`,
    mobileLink: `${baseMobileLink} text-[var(--public-muted)] hover:bg-[var(--public-surface)] hover:text-[var(--public-primary)]`,
    mobileCta: `${solidCta} w-full`,
  },
  minimal: {
    header: `${baseHeader} border-black/5 bg-[var(--public-background)]/88`,
    inner: `${baseInner} justify-between`,
    brand: "font-semibold tracking-tight",
    desktopNav: `${baseDesktopNav} gap-7`,
    navLink: lightNavLink,
    cta: `${baseCta} text-[var(--public-primary)] underline-offset-4 hover:underline`,
    menuButton: `${baseMenuButton} border-black/10 bg-transparent text-[var(--public-text)] hover:bg-[var(--public-surface)]`,
    mobileNav: `${baseMobileNav} border-black/10 bg-[var(--public-background)]/98`,
    mobileLink: `${baseMobileLink} text-[var(--public-muted)] hover:bg-[var(--public-surface)]`,
    mobileCta: `${solidCta} w-full`,
  },
  premium: {
    header: `${baseHeader} border-black/10 bg-[#f4f1ec]/92 shadow-sm shadow-slate-950/5`,
    inner: `${baseInner} justify-between`,
    brand: "font-black tracking-tight text-slate-950",
    desktopNav: `${baseDesktopNav} gap-6`,
    navLink: "text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
    cta: `${baseCta} bg-slate-950 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg`,
    menuButton: `${baseMenuButton} border-slate-950/10 bg-white/70 text-slate-950 hover:bg-white`,
    mobileNav: `${baseMobileNav} border-slate-950/10 bg-[#f4f1ec]/98`,
    mobileLink: `${baseMobileLink} text-slate-700 hover:bg-white/70 hover:text-slate-950`,
    mobileCta: `${baseCta} w-full bg-slate-950 text-white`,
  },
  transparent: {
    header: `${baseHeader} border-white/20 bg-transparent text-white shadow-none`,
    inner: `${baseInner} justify-between`,
    brand: "font-bold text-white",
    desktopNav: baseDesktopNav,
    navLink: darkNavLink,
    cta: `${baseCta} border border-white/30 bg-white/10 text-white hover:bg-white hover:text-slate-950`,
    menuButton: `${baseMenuButton} border-white/20 bg-white/10 text-white hover:bg-white/20`,
    mobileNav: `${baseMobileNav} border-white/10 bg-slate-950/95 text-white`,
    mobileLink: `${baseMobileLink} text-white/78 hover:bg-white/10 hover:text-white`,
    mobileCta: `${baseCta} w-full bg-white text-slate-950`,
  },
  centered: {
    header: `${baseHeader} border-black/10 bg-[var(--public-background)]/95`,
    inner: `${baseInner} justify-between md:grid md:grid-cols-[1fr_auto_1fr]`,
    brand: "font-bold md:justify-self-center",
    desktopNav: `${baseDesktopNav} md:contents`,
    navLink: lightNavLink,
    cta: lightCta,
    menuButton: `${baseMenuButton} border-black/10 bg-white/60 text-[var(--public-text)] hover:bg-white`,
    mobileNav: `${baseMobileNav} border-black/10 bg-[var(--public-background)]/98`,
    mobileLink: `${baseMobileLink} text-[var(--public-muted)] hover:bg-[var(--public-surface)]`,
    mobileCta: `${solidCta} w-full`,
  },
  "cta-focused": {
    header: `${baseHeader} border-black/10 bg-[var(--public-background)]/95`,
    inner: `${baseInner} justify-between`,
    brand: "font-bold",
    desktopNav: baseDesktopNav,
    navLink: lightNavLink,
    cta: solidCta,
    menuButton: `${baseMenuButton} border-black/10 bg-white/60 text-[var(--public-text)] hover:bg-white`,
    mobileNav: `${baseMobileNav} border-black/10 bg-[var(--public-background)]/98`,
    mobileLink: `${baseMobileLink} text-[var(--public-muted)] hover:bg-[var(--public-surface)]`,
    mobileCta: `${solidCta} w-full`,
  },
  editorial: {
    header: `${baseHeader} border-black/10 bg-white/92`,
    inner: `${baseInner} justify-between`,
    brand: "font-serif text-lg font-bold tracking-tight text-slate-950",
    desktopNav: `${baseDesktopNav} uppercase tracking-widest text-[11px]`,
    navLink: "text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
    cta: `${baseCta} border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white`,
    menuButton: `${baseMenuButton} border-black/10 bg-white text-slate-950 hover:bg-slate-50`,
    mobileNav: `${baseMobileNav} border-black/10 bg-white`,
    mobileLink: `${baseMobileLink} text-slate-600 hover:bg-slate-50 hover:text-slate-950`,
    mobileCta: `${baseCta} w-full border border-slate-950 text-slate-950`,
  },
  "local-business": {
    header: `${baseHeader} border-black/10 bg-white/95 shadow-sm shadow-slate-950/5`,
    inner: `${baseInner} justify-between`,
    brand: "font-extrabold text-[var(--public-primary)]",
    desktopNav: baseDesktopNav,
    navLink: lightNavLink,
    cta: `${baseCta} bg-[var(--public-accent)] text-slate-950 shadow-sm hover:-translate-y-0.5 hover:shadow-md`,
    menuButton: `${baseMenuButton} border-black/10 bg-white text-[var(--public-text)] hover:bg-[var(--public-surface)]`,
    mobileNav: `${baseMobileNav} border-black/10 bg-white`,
    mobileLink: `${baseMobileLink} text-[var(--public-muted)] hover:bg-[var(--public-surface)]`,
    mobileCta: `${baseCta} w-full bg-[var(--public-accent)] text-slate-950`,
  },
  playful: {
    header: `${baseHeader} border-black/10 bg-[var(--public-background)]/95`,
    inner: `${baseInner} justify-between`,
    brand: "font-black tracking-tight",
    desktopNav: baseDesktopNav,
    navLink: "rounded-full px-3 py-1.5 text-[var(--public-muted)] transition-colors hover:bg-[var(--public-accent)]/20 hover:text-[var(--public-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-primary)] focus-visible:ring-offset-2",
    cta: `${baseCta} rounded-full bg-[var(--public-accent)] text-slate-950 shadow-sm hover:-translate-y-0.5 hover:shadow-md`,
    menuButton: `${baseMenuButton} rounded-full border-black/10 bg-white/70 text-[var(--public-text)] hover:bg-white`,
    mobileNav: `${baseMobileNav} border-black/10 bg-[var(--public-background)]/98`,
    mobileLink: `${baseMobileLink} rounded-full text-[var(--public-muted)] hover:bg-[var(--public-accent)]/20`,
    mobileCta: `${baseCta} w-full rounded-full bg-[var(--public-accent)] text-slate-950`,
  },
  luxury: {
    header: `${baseHeader} border-white/10 bg-slate-950/95 text-white shadow-lg shadow-black/20`,
    inner: `${baseInner} justify-between`,
    brand: "font-serif text-lg font-semibold tracking-wide text-white",
    desktopNav: `${baseDesktopNav} uppercase tracking-[0.18em] text-[11px]`,
    navLink: darkNavLink,
    cta: `${baseCta} border border-[var(--public-accent)]/70 text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-slate-950`,
    menuButton: `${baseMenuButton} border-white/15 bg-white/5 text-white hover:bg-white/10`,
    mobileNav: `${baseMobileNav} border-white/10 bg-slate-950 text-white`,
    mobileLink: `${baseMobileLink} text-white/72 hover:bg-white/8 hover:text-white`,
    mobileCta: `${baseCta} w-full border border-[var(--public-accent)] text-[var(--public-accent)]`,
  },
};
