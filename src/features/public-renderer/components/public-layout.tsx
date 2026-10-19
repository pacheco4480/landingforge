import { SkipLink } from "@/components/ui/skip-link";
import { CookieConsentBanner } from "@/features/legal/components/cookie-consent-banner";
import { getPublicLegalSettings } from "@/features/legal/services/legal-settings.service";
import {
  PublicHeader,
  type PublicHeaderBrand,
  type PublicHeaderLink,
  type PublicHeaderVariant,
} from "@/features/public-renderer/components/public-header";
import {
  PublicFooter,
  type PublicFooterBrand,
  type PublicFooterLink,
  type PublicFooterVariant,
} from "@/features/public-renderer/components/public-footer";
import { isRecord, text } from "@/features/public-renderer/components/section-utils";
import type { PublicRendererContext } from "@/features/public-renderer/types";

export async function PublicLayout({
  context,
  children,
}: {
  context: PublicRendererContext;
  children: React.ReactNode;
}) {
  const legal = await getPublicLegalSettings();
  const privacyHref = legal.privacyPage
    ? `/${legal.privacyPage.slug}`
    : "/politica-privacidade";
  const cookieHref = legal.cookiePage
    ? `/${legal.cookiePage.slug}`
    : "/politica-cookies";
  const termsHref = legal.termsPage
    ? `/${legal.termsPage.slug}`
    : "/termos-condicoes";
  const brand = getPageBrand(context);
  const header = getPageHeader(context, brand);
  const footer = getPageFooter(context, brand, [
    { href: privacyHref, label: "Politica de Privacidade" },
    { href: cookieHref, label: "Politica de Cookies" },
    { href: termsHref, label: "Termos e Condicoes" },
  ]);

  return (
    <div
      className="min-h-screen bg-[var(--public-background)] text-[var(--public-text)]"
      style={{
        fontFamily: "var(--public-body-font)",
      }}
    >
      <SkipLink />
      <PublicHeader
        brand={header.brand}
        cta={header.cta}
        links={header.links}
        variant={header.variant}
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter
        brand={footer.brand}
        cta={footer.cta}
        legalLinks={footer.legalLinks}
        links={footer.links}
        variant={footer.variant}
      />
      <CookieConsentBanner
        analyticsEnabled={legal.analyticsCookiesEnabled}
        cookiePolicyHref={cookieHref}
        enabled={legal.cookieBannerEnabled}
        marketingEnabled={legal.marketingCookiesEnabled}
        version={legal.consentVersion}
      />
    </div>
  );
}

function getPageBrand(context: PublicRendererContext) {
  const brandSection = getBrandSection(context);
  const content = brandSection?.content;
  const hasPageBrand = isRecord(content);
  const businessName = text(
    content,
    "brandName",
    text(content, "logoText", context.site.businessName),
  );
  const contactSection = context.page.sections.find(
    (section) => section.sectionKey === "contact" || section.sectionType === "contact",
  );

  return {
    businessName,
    contactEmail: text(contactSection?.content, "email", context.site.contactEmail),
    location: getFooterLocation(context, contactSection?.content),
    phone: text(contactSection?.content, "phone", ""),
    logoAltText: text(
      content,
      "logoAltText",
      hasPageBrand ? businessName : context.site.logoMedia?.altText ?? context.site.businessName,
    ),
    logoUrl: hasPageBrand
      ? text(content, "logoUrl", "")
      : context.site.logoMedia?.publicUrl ?? "",
  };
}

function getPageFooter(
  context: PublicRendererContext,
  brand: PublicFooterBrand & PublicHeaderBrand,
  legalLinks: PublicFooterLink[],
) {
  const brandSection = getBrandSection(context);
  const content = brandSection?.content;
  const templateKey = context.page.template?.key ?? "default";
  const variantKey = context.page.templateVariant?.key ?? "default";
  const defaults = getFooterDefaults(templateKey, variantKey);
  const requestedVariant = text(content, "footerVariant", defaults.defaultVariant);
  const variant = defaults.allowedVariants.includes(requestedVariant as PublicFooterVariant)
    ? (requestedVariant as PublicFooterVariant)
    : defaults.defaultVariant;

  return {
    brand: {
      businessName: text(content, "brandName", brand.businessName),
      contactEmail: text(content, "contactEmail", brand.contactEmail),
      location: text(content, "location", brand.location),
      phone: text(content, "phone", brand.phone),
    },
    cta: getFooterCta(content, defaults.cta),
    legalLinks,
    links: getFooterLinks(content, defaults.links),
    variant,
  };
}

function getPageHeader(
  context: PublicRendererContext,
  brand: PublicHeaderBrand & { contactEmail: string },
) {
  const brandSection = getBrandSection(context);
  const content = brandSection?.content;
  const templateKey = context.page.template?.key ?? "default";
  const variantKey = context.page.templateVariant?.key ?? "default";
  const defaults = getHeaderDefaults(templateKey, variantKey);
  const requestedVariant = text(content, "headerVariant", defaults.defaultVariant);
  const variant = defaults.allowedVariants.includes(requestedVariant as PublicHeaderVariant)
    ? (requestedVariant as PublicHeaderVariant)
    : defaults.defaultVariant;

  return {
    brand: {
      businessName: text(content, "brandName", brand.businessName),
      logoAltText: brand.logoAltText,
      logoUrl: brand.logoUrl,
    },
    cta: getHeaderCta(content, defaults.cta),
    links: getHeaderLinks(content, defaults.links),
    variant,
  };
}

function getBrandSection(context: PublicRendererContext) {
  return context.page.sections.find((section) => {
    if (!isRecord(section.content)) return false;

    return Boolean(section.content.brandName || section.content.logoText);
  });
}

function getHeaderDefaults(templateKey: string, variantKey: string): {
  allowedVariants: PublicHeaderVariant[];
  cta: PublicHeaderLink;
  defaultVariant: PublicHeaderVariant;
  links: PublicHeaderLink[];
} {
  if (templateKey === "real_estate" && variantKey === "premium") {
    return {
      allowedVariants: ["premium", "minimal", "transparent", "cta-focused"],
      cta: { href: "#contact", label: "Agendar reunião" },
      defaultVariant: "premium",
      links: [
        { href: "#featured-properties", label: "Portfolio" },
        { href: "#services", label: "Método" },
        { href: "#process", label: "Processo" },
      ],
    };
  }

  if (templateKey === "real_estate" && variantKey === "local_agency") {
    return {
      allowedVariants: ["classic", "local-business", "cta-focused"],
      cta: { href: "#valuation", label: "Pedir avaliação" },
      defaultVariant: "local-business",
      links: [
        { href: "#featured-properties", label: "Imóveis" },
        { href: "#local-expertise", label: "Bairros" },
        { href: "#agents", label: "Equipa" },
      ],
    };
  }

  if (templateKey === "real_estate" && variantKey === "luxury") {
    return {
      allowedVariants: ["luxury", "minimal", "transparent", "premium"],
      cta: { href: "#contact", label: "Consulta privada" },
      defaultVariant: "luxury",
      links: [
        { href: "#featured-properties", label: "Portfolio" },
        { href: "#luxury-advisory", label: "Advisory" },
        { href: "#faq", label: "FAQ" },
      ],
    };
  }

  if (templateKey === "clinic" && variantKey === "luxury") {
    return {
      allowedVariants: ["luxury", "premium", "minimal", "cta-focused"],
      cta: { href: "#booking", label: "Consulta privada" },
      defaultVariant: "luxury",
      links: [
        { href: "#private-experience", label: "Experiencia" },
        { href: "#clinic-specialties", label: "Tratamentos" },
        { href: "#clinic-doctors", label: "Equipa" },
      ],
    };
  }

  if (templateKey === "clinic") {
    return {
      allowedVariants: ["classic", "minimal", "cta-focused", "editorial"],
      cta: { href: "#booking", label: "Agendar consulta" },
      defaultVariant: variantKey === "modern" ? "cta-focused" : "classic",
      links: [
        { href: "#clinic-specialties", label: "Especialidades" },
        { href: "#clinic-process", label: "Processo" },
        { href: "#clinic-doctors", label: "Equipa" },
      ],
    };
  }

  if (templateKey === "restaurant" && variantKey === "fine_dining") {
    return {
      allowedVariants: ["luxury", "editorial", "minimal", "premium"],
      cta: { href: "#reservation", label: "Reservar" },
      defaultVariant: "luxury",
      links: [
        { href: "#menu", label: "Menu" },
        { href: "#experience", label: "Experiência" },
        { href: "#location", label: "Localização" },
      ],
    };
  }

  if (templateKey === "restaurant" && variantKey === "playful") {
    return {
      allowedVariants: ["playful", "cta-focused", "classic"],
      cta: { href: "#reservation", label: "Reservar grupo" },
      defaultVariant: "playful",
      links: [
        { href: "#menu", label: "Favoritos" },
        { href: "#signature-dishes", label: "Mesa" },
        { href: "#location", label: "Chegar" },
      ],
    };
  }

  if (templateKey === "bakery" && variantKey === "playful") {
    return {
      allowedVariants: ["playful", "cta-focused", "classic"],
      cta: { href: "#custom-orders", label: "Criar o meu bolo" },
      defaultVariant: "playful",
      links: [
        { href: "#products", label: "Mais pedidos" },
        { href: "#custom-orders", label: "Encomendas" },
        { href: "#gallery", label: "Galeria" },
      ],
    };
  }

  return {
    allowedVariants: ["classic", "minimal", "cta-focused"],
    cta: { href: "#contact", label: "Contactar" },
    defaultVariant: "classic",
    links: [
      { href: "#services", label: "Serviços" },
      { href: "#testimonials", label: "Prova social" },
      { href: "#faq", label: "FAQ" },
    ],
  };
}

function getFooterDefaults(templateKey: string, variantKey: string): {
  allowedVariants: PublicFooterVariant[];
  cta: PublicFooterLink | null;
  defaultVariant: PublicFooterVariant;
  links: PublicFooterLink[];
} {
  if (templateKey === "real_estate" && variantKey === "premium") {
    return {
      allowedVariants: ["premium", "editorial", "cta-focused", "minimal-legal"],
      cta: { href: "#contact", label: "Solicitar market brief" },
      defaultVariant: "premium",
      links: [
        { href: "#featured-properties", label: "Portfolio" },
        { href: "#services", label: "Metodo" },
        { href: "#process", label: "Processo" },
      ],
    };
  }

  if (templateKey === "real_estate" && variantKey === "local_agency") {
    return {
      allowedVariants: ["local-business", "classic", "cta-focused", "minimal-legal"],
      cta: { href: "#valuation", label: "Pedir avaliacao local" },
      defaultVariant: "local-business",
      links: [
        { href: "#featured-properties", label: "Imoveis" },
        { href: "#local-expertise", label: "Bairros" },
        { href: "#agents", label: "Equipa" },
      ],
    };
  }

  if (templateKey === "real_estate" && variantKey === "luxury") {
    return {
      allowedVariants: ["luxury", "premium", "minimal-legal"],
      cta: { href: "#contact", label: "Consulta privada" },
      defaultVariant: "luxury",
      links: [
        { href: "#featured-properties", label: "Portfolio" },
        { href: "#luxury-advisory", label: "Advisory" },
        { href: "#faq", label: "FAQ" },
      ],
    };
  }

  if (templateKey === "clinic" && variantKey === "luxury") {
    return {
      allowedVariants: ["luxury", "premium", "minimal-legal"],
      cta: { href: "#booking", label: "Consulta privada" },
      defaultVariant: "luxury",
      links: [
        { href: "#private-experience", label: "Experiencia privada" },
        { href: "#clinic-specialties", label: "Tratamentos" },
        { href: "#contact", label: "Contacto" },
      ],
    };
  }

  if (templateKey === "clinic") {
    return {
      allowedVariants: ["classic", "cta-focused", "editorial", "minimal-legal"],
      cta: { href: "#booking", label: "Agendar consulta" },
      defaultVariant: variantKey === "modern" ? "editorial" : "classic",
      links: [
        { href: "#clinic-specialties", label: "Especialidades" },
        { href: "#clinic-process", label: "Processo" },
        { href: "#clinic-locations", label: "Localizacao" },
      ],
    };
  }

  if (templateKey === "restaurant" && variantKey === "fine_dining") {
    return {
      allowedVariants: ["luxury", "editorial", "premium", "minimal-legal"],
      cta: { href: "#reservation", label: "Reservar mesa" },
      defaultVariant: "luxury",
      links: [
        { href: "#menu", label: "Menu" },
        { href: "#experience", label: "Experiência" },
        { href: "#location", label: "Localização" },
      ],
    };
  }

  if (templateKey === "restaurant" && variantKey === "playful") {
    return {
      allowedVariants: ["playful", "cta-focused", "classic"],
      cta: { href: "#reservation", label: "Reservar grupo" },
      defaultVariant: "playful",
      links: [
        { href: "#menu", label: "Favoritos" },
        { href: "#reviews", label: "Grupos" },
        { href: "#location", label: "Chegar" },
      ],
    };
  }

  if (templateKey === "bakery" && variantKey === "playful") {
    return {
      allowedVariants: ["playful", "cta-focused", "classic"],
      cta: { href: "#custom-orders", label: "Criar o meu bolo" },
      defaultVariant: "playful",
      links: [
        { href: "#products", label: "Mais pedidos" },
        { href: "#gallery", label: "Galeria" },
        { href: "#contact", label: "Contacto" },
      ],
    };
  }

  return {
    allowedVariants: ["classic", "simple", "cta-focused", "minimal-legal"],
    cta: { href: "#contact", label: "Contactar" },
    defaultVariant: "classic",
    links: [
      { href: "#services", label: "Servicos" },
      { href: "#testimonials", label: "Prova social" },
      { href: "#faq", label: "FAQ" },
    ],
  };
}

function getHeaderCta(
  content: unknown,
  fallback: PublicHeaderLink,
): PublicHeaderLink {
  return {
    href: text(content, "headerCtaHref", fallback.href),
    label: text(content, "headerCtaLabel", fallback.label),
  };
}

function getHeaderLinks(
  content: unknown,
  fallback: PublicHeaderLink[],
): PublicHeaderLink[] {
  if (!isRecord(content) || !Array.isArray(content.headerLinks)) return fallback;

  const links = content.headerLinks
    .filter(isRecord)
    .map((item) => ({
      href: text(item, "href"),
      label: text(item, "label"),
    }))
    .filter((item) => item.href && item.label);

  return links.length ? links.slice(0, 5) : fallback;
}

function getFooterCta(
  content: unknown,
  fallback: PublicFooterLink | null,
): PublicFooterLink | null {
  if (!fallback && !isRecord(content)) return null;

  const href = text(content, "footerCtaHref", fallback?.href ?? "");
  const label = text(content, "footerCtaLabel", fallback?.label ?? "");

  return href && label ? { href, label } : fallback;
}

function getFooterLinks(
  content: unknown,
  fallback: PublicFooterLink[],
): PublicFooterLink[] {
  if (!isRecord(content) || !Array.isArray(content.footerLinks)) return fallback;

  const links = content.footerLinks
    .filter(isRecord)
    .map((item) => ({
      href: text(item, "href"),
      label: text(item, "label"),
    }))
    .filter((item) => item.href && item.label);

  return links.length ? links.slice(0, 6) : fallback;
}

function getFooterLocation(context: PublicRendererContext, content: unknown) {
  const explicitLocation = text(content, "address", "");
  if (explicitLocation) return explicitLocation;

  return [context.site.city, context.site.country].filter(Boolean).join(" ");
}
