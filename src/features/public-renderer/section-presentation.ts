export const FAQ_PRESENTATIONS = ["accordion", "editorial", "grouped"] as const;
export const CONTACT_PRESENTATIONS = [
  "standard",
  "compact",
  "editorial",
] as const;

export type FaqPresentation = (typeof FAQ_PRESENTATIONS)[number];
export type ContactPresentation = (typeof CONTACT_PRESENTATIONS)[number];
export type PresentationOption = {
  value: string;
  label: string;
  description: string;
};

const faqOptions: PresentationOption[] = [
  {
    value: "accordion",
    label: "Acordeão",
    description: "Perguntas expansíveis, adequadas a listas mais longas.",
  },
  {
    value: "editorial",
    label: "Editorial",
    description:
      "Perguntas e respostas em coluna tipográfica, sempre visíveis.",
  },
  {
    value: "grouped",
    label: "Cartões agrupados",
    description: "Blocos independentes em grelha, sempre visíveis.",
  },
];

const contactOptions: PresentationOption[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Contexto e contactos ao lado do formulário.",
  },
  {
    value: "compact",
    label: "Compacto",
    description: "Composição centrada e espaçamento reduzido.",
  },
  {
    value: "editorial",
    label: "Editorial dividido",
    description: "Painel de contacto destacado junto ao formulário.",
  },
];

const faqDefaults: Record<string, FaqPresentation> = {
  "clinic:modern": "accordion",
  "clinic:luxury": "editorial",
  "real_estate:local_agency": "grouped",
  "real_estate:premium": "editorial",
  "restaurant:fine_dining": "editorial",
  "restaurant:playful": "grouped",
  "bakery:playful": "grouped",
  "gym:modern": "accordion",
};

const contactDefaults: Record<string, ContactPresentation> = {
  "clinic:modern": "standard",
  "clinic:luxury": "editorial",
  "real_estate:local_agency": "editorial",
  "real_estate:premium": "editorial",
  "restaurant:fine_dining": "editorial",
  "restaurant:playful": "compact",
  "bakery:playful": "compact",
  "gym:modern": "standard",
};

const allowedByTemplate: Record<
  string,
  { faq?: FaqPresentation[]; contact?: ContactPresentation[] }
> = {
  "clinic:modern": {
    faq: ["accordion", "grouped"],
    contact: ["standard", "editorial"],
  },
  "clinic:luxury": {
    faq: ["editorial", "grouped"],
    contact: ["editorial", "standard"],
  },
  "real_estate:local_agency": {
    faq: ["grouped", "accordion"],
    contact: ["editorial", "standard"],
  },
  "real_estate:premium": {
    faq: ["editorial", "grouped"],
    contact: ["editorial", "compact"],
  },
  "restaurant:fine_dining": {
    faq: ["editorial", "accordion"],
    contact: ["editorial", "standard"],
  },
  "restaurant:playful": {
    faq: ["grouped", "accordion"],
    contact: ["compact", "standard"],
  },
  "bakery:playful": {
    faq: ["grouped", "accordion"],
    contact: ["compact", "standard"],
  },
  "gym:modern": {
    faq: ["accordion", "grouped"],
    contact: ["standard", "compact"],
  },
};

const faqSectionTypes = new Set(["faq", "bakery_faq", "gym_faq"]);
const contactSectionTypes = new Set([
  "contact",
  "bakery_contact",
  "gym_contact",
]);

function templateVariantId(
  templateKey?: string | null,
  variantKey?: string | null,
) {
  return `${templateKey ?? "base"}:${variantKey ?? "base"}`;
}

export function presentationOptions(
  sectionType: string,
  templateKey?: string | null,
  variantKey?: string | null,
) {
  const compatibility =
    allowedByTemplate[templateVariantId(templateKey, variantKey)];
  if (faqSectionTypes.has(sectionType)) {
    const allowed = compatibility?.faq;
    return allowed
      ? allowed
          .map((value) => faqOptions.find((option) => option.value === value)!)
          .filter(Boolean)
      : faqOptions;
  }
  if (contactSectionTypes.has(sectionType)) {
    const allowed = compatibility?.contact;
    return allowed
      ? allowed
          .map(
            (value) => contactOptions.find((option) => option.value === value)!,
          )
          .filter(Boolean)
      : contactOptions;
  }
  return [];
}

export function defaultPresentation(
  sectionType: string,
  templateKey?: string | null,
  variantKey?: string | null,
) {
  const templateId = templateVariantId(templateKey, variantKey);
  if (faqSectionTypes.has(sectionType))
    return faqDefaults[templateId] ?? "grouped";
  if (contactSectionTypes.has(sectionType))
    return contactDefaults[templateId] ?? "standard";
  return "";
}

export function resolvePresentation(
  sectionType: string,
  settings: unknown,
  templateKey?: string | null,
  variantKey?: string | null,
) {
  const fallback = defaultPresentation(sectionType, templateKey, variantKey);
  if (
    !fallback ||
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings)
  )
    return fallback;
  const value = (settings as Record<string, unknown>).presentationVariant;
  const allowed = presentationOptions(
    sectionType,
    templateKey,
    variantKey,
  ).some((option) => option.value === value);
  return allowed ? String(value) : fallback;
}

export function normalizePresentationSettings(
  settings: Record<string, unknown>,
  sectionType: string,
  submittedValue: string,
  templateKey?: string | null,
  variantKey?: string | null,
) {
  const next = { ...settings };
  const options = presentationOptions(sectionType, templateKey, variantKey);
  if (!options.length || submittedValue === "__default") {
    delete next.presentationVariant;
    return next;
  }
  if (options.some((option) => option.value === submittedValue)) {
    next.presentationVariant = submittedValue;
  } else {
    delete next.presentationVariant;
  }
  return next;
}
