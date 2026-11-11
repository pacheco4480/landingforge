export type ContentRecord = Record<string, unknown>;

export type ContentField = {
  key: string;
  label: string;
  kind: "text" | "long-text" | "url" | "number";
  maxLength: number;
  optional: boolean;
  help: string;
};

export function parseNumericFieldValue(value: string): number | "" {
  return value === "" ? "" : Number(value);
}

const labels: Record<string, string> = {
  title: "Título", text: "Texto de introdução", headline: "Título principal", subheadline: "Descrição principal", context: "Contexto",
  eyebrow: "Texto de apoio", brandName: "Nome da marca", ctaPrimary: "Texto do botão principal", ctaSecondary: "Texto do botão secundário",
  ctaPrimaryHref: "Ligação do botão principal", ctaSecondaryHref: "Ligação do botão secundário", href: "Ligação", url: "Endereço web",
  image: "Endereço da imagem", heroImage: "Imagem principal", secondaryImage: "Imagem complementar", imageAlt: "Texto alternativo da imagem",
  heroImageAlt: "Texto alternativo da imagem principal", secondaryImageAlt: "Texto alternativo da imagem complementar", videoUrl: "Endereço do vídeo",
  address: "Morada", hours: "Horário", phone: "Telefone", email: "Email", website: "Website", mapQuery: "Localização no mapa",
  reservationNote: "Nota sobre reservas", proofLabel: "Etiqueta de confiança", proofText: "Informação de confiança", quote: "Testemunho",
  name: "Nome apresentado", label: "Etiqueta", description: "Descrição", question: "Pergunta", answer: "Resposta", category: "Categoria",
  price: "Preço ou indicação", value: "Valor", number: "Valor numérico", unit: "Unidade", icon: "Ícone", location: "Localização",
  specialty: "Especialidade", qualification: "Qualificação", role: "Função", credential: "Credencial", duration: "Duração",
  date: "Data", subtitle: "Subtítulo", badge: "Destaque", ctaLabel: "Texto do botão", ctaHref: "Ligação do botão",
  primaryCta: "Texto do botão principal", secondaryCta: "Texto do botão secundário", intro: "Introdução", caption: "Legenda",
  alt: "Texto alternativo", imageUrl: "Endereço da imagem", mapUrl: "Ligação do mapa", rating: "Classificação",
  openingHours: "Horário de funcionamento", availability: "Disponibilidade", service: "Serviço", audience: "Público",
  footerCtaLabel: "Texto do botão do rodapé", footerCtaHref: "Ligação do botão do rodapé", headerCtaLabel: "Texto do botão do cabeçalho",
  headerCtaHref: "Ligação do botão do cabeçalho", logoText: "Texto do logótipo", headlineHighlight: "Destaque do título",
  labelText: "Etiqueta", eyebrowText: "Texto de apoio", buttonLabel: "Texto do botão",
  buttonHref: "Ligação do botão", ctaText: "Texto da chamada para ação", ctaDescription: "Descrição da chamada para ação",
  imageCaption: "Legenda da imagem", photo: "Endereço da fotografia", photoAlt: "Texto alternativo da fotografia",
  beforeImage: "Imagem inicial", beforeImageAlt: "Texto alternativo da imagem inicial", afterImage: "Imagem final", afterImageAlt: "Texto alternativo da imagem final",
  bedrooms: "Quartos", bathrooms: "Casas de banho", beds: "Quartos", baths: "Casas de banho", area: "Área", areaLabel: "Etiqueta da área", propertyType: "Tipo de imóvel",
  propertyTypeLabel: "Tipo de imóvel", priceLabel: "Preço apresentado", reference: "Referência", status: "Estado apresentado", type: "Tipo apresentado", tag: "Etiqueta de destaque",
  year: "Ano", condition: "Estado de conservação", energyRating: "Classe energética", featuresLabel: "Título das vantagens",
  statistic: "Indicador", statisticLabel: "Descrição do indicador", credentialTitle: "Título da credencial", institution: "Instituição",
  bio: "Apresentação profissional", languages: "Idiomas", profile: "Perfil da zona", trend: "Tendência local", averagePrice: "Preço médio apresentado", averageTime: "Tempo médio apresentado",
  memberSince: "Membro desde", approach: "Abordagem", step: "Etapa", stepNumber: "Número da etapa", patientType: "Tipo de paciente",
  durationLabel: "Duração", treatment: "Tratamento", treatmentName: "Nome do tratamento", specialtyName: "Nome da especialidade",
  doctorName: "Nome do profissional", professionalTitle: "Título profissional", registration: "Número de registo profissional",
  mapEmbedUrl: "Endereço do mapa", directionsUrl: "Ligação para direções", reservationUrl: "Ligação para reservas",
  bookingUrl: "Ligação para marcação", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook",
  calories: "Calorias", allergens: "Alergénios", dietary: "Informação alimentar", size: "Dimensão", level: "Nível",
  frequency: "Frequência", className: "Nome da aula", coach: "Treinador", plan: "Plano", offer: "Oferta",
  result: "Resultado", resultLabel: "Descrição do resultado", before: "Valor inicial", after: "Valor final",
  availabilityLabel: "Disponibilidade", addressLine: "Morada", city: "Localidade", postalCode: "Código postal",
  country: "País", mapLink: "Ligação do mapa", externalUrl: "Ligação externa", backgroundImage: "Endereço da imagem de fundo",
  backgroundImageAlt: "Texto alternativo da imagem de fundo", portrait: "Endereço do retrato", portraitAlt: "Texto alternativo do retrato",
  items: "Itens", details: "Detalhes", headerLinks: "Ligações do cabeçalho", footerLinks: "Ligações do rodapé", links: "Ligações",
  properties: "Imóveis", doctors: "Profissionais", specialties: "Especialidades", credentials: "Credenciais", locations: "Localizações",
  facilities: "Instalações", programs: "Programas", classes: "Aulas", coaches: "Treinadores", plans: "Planos", transformations: "Transformações",
  offers: "Ofertas", products: "Produtos", steps: "Etapas", benefits: "Vantagens", values: "Valores", services: "Serviços", menu: "Menu",
  stats: "Indicadores", proof: "Elementos de confiança",
};

const privateKeys = /(?:password|secret|token|database|tenant|project|internal|admin|recipient|authorization|authentication|variant|layout|(?:^|[_-])auth(?:$|[_-])|(?:credential|auth)(?:key|hash)|(?:api|service|access|refresh)key)/i;
const collectionKeys = new Set(["items", "details", "headerLinks", "footerLinks", "links", "properties", "doctors", "specialties", "credentials", "locations", "facilities", "programs", "classes", "coaches", "plans", "transformations", "offers", "products", "steps", "benefits", "values", "services", "menu", "hours", "stats", "proof"]);
const collectionLabels: Record<string, string> = {
  items: "Itens", details: "Detalhes", headerLinks: "Ligações do cabeçalho", footerLinks: "Ligações do rodapé", links: "Ligações",
  properties: "Imóveis", doctors: "Profissionais", specialties: "Especialidades", credentials: "Credenciais", locations: "Localizações",
  facilities: "Instalações", programs: "Programas", classes: "Aulas", coaches: "Treinadores", plans: "Planos", transformations: "Transformações",
  offers: "Ofertas", products: "Produtos", steps: "Etapas", benefits: "Vantagens", values: "Valores", services: "Serviços", menu: "Menu", hours: "Horários",
  stats: "Indicadores", proof: "Elementos de confiança",
};
const maxItems: Record<string, number> = { items: 30, details: 20, headerLinks: 12, footerLinks: 12, links: 20, properties: 30, doctors: 30, specialties: 30, credentials: 30, locations: 20, facilities: 30, programs: 30, classes: 30, coaches: 30, plans: 20, transformations: 30, offers: 30, products: 30, steps: 20, benefits: 30, values: 30, services: 30, menu: 30, hours: 20, stats: 20, proof: 20 };
const optionalKeys = new Set(["context", "price", "image", "heroImage", "secondaryImage", "imageAlt", "heroImageAlt", "secondaryImageAlt", "description", "eyebrow", "subtitle", "proofLabel", "proofText", "reservationNote", "phone", "email", "website", "mapQuery", "videoUrl", "ctaSecondary", "ctaSecondaryHref", "secondaryCta"]);
const emptyCollectionFields: Record<string, string[]> = {
  doctors: ["name", "title", "qualification", "image", "imageAlt"], specialties: ["title", "description"],
  credentials: ["title", "description", "institution"], locations: ["name", "address", "phone", "hours"],
  facilities: ["title", "description", "image", "imageAlt"], programs: ["title", "description", "label", "image", "imageAlt"],
  classes: ["title", "description", "level"], coaches: ["name", "title", "image", "imageAlt"],
  products: ["title", "label", "description", "image", "imageAlt", "price"], steps: ["title", "description"],
  items: ["title", "description"], details: ["label", "value"], headerLinks: ["label", "href"], footerLinks: ["label", "href"], links: ["label", "href"],
  stats: ["label", "value"], proof: ["label", "value"], properties: ["title", "location", "price", "status", "type", "beds", "baths", "area", "image", "imageAlt", "ctaLabel"],
};

export function isEditableContentKey(key: string, value: unknown) {
  if (!labels[key] || privateKeys.test(key)) return false;
  if (typeof value === "string" || typeof value === "number") return true;
  if (Array.isArray(value) && collectionKeys.has(key)) return value.every(isRecord);
  return false;
}

export function editableContentKeys(content: unknown) {
  const record = asRecord(content);
  return Object.keys(record).filter((key) => isEditableContentKey(key, record[key])).sort();
}

export function getContentFields(record: ContentRecord, keys: string[], sectionType?: string): ContentField[] {
  return keys.flatMap((key) => {
    const value = record[key];
    if (!isEditableContentKey(key, value) || Array.isArray(value)) return [];
    const kind = typeof value === "number" ? "number" : isUrlKey(key) ? "url" : /(?:text|description|answer|quote|address|hours|subheadline|proofText|reservationNote)/i.test(key) ? "long-text" : "text";
    const profile = repeatableItemProfile(sectionType);
    const specificField = profile?.fields.find((field) => field.key === key);
    const maxLength = specificField?.maxLength ?? (kind === "url" ? 2000 : /alt/i.test(key) ? 300 : kind === "long-text" ? 1200 : 240);
    const help = kind === "url"
      ? /image/i.test(key) ? "Usa o endereço público da imagem. Acrescenta um texto alternativo que descreva o que é relevante." : /email/i.test(key) ? "Indica um endereço de email válido." : "Usa uma ligação completa ou um identificador de secção, como #contacto."
      : /hours/i.test(key) ? "Indica os dias e horários de funcionamento de forma legível." : /alt/i.test(key) ? "Descreve a imagem para quem não a consegue ver; deixa vazio apenas se for decorativa." : /price/i.test(key) ? "Indica o preço apresentado ao visitante, incluindo a moeda quando aplicável." : kind === "long-text" ? "Escreve o conteúdo apresentado nesta secção da landing page." : "Texto apresentado ao visitante nesta secção.";
    return [{ key, label: labels[key], kind, maxLength, optional: specificField ? !specificField.required : optionalKeys.has(key), help }];
  });
}

export function getContentCollections(sectionType: string, record: ContentRecord, keys: string[]) {
  return keys.flatMap((key) => {
    if (!collectionKeys.has(key) || !Array.isArray(record[key]) || !record[key].every(isRecord)) return [];
    const items = record[key] as ContentRecord[];
    const itemKeys = [...new Set(items.flatMap((item) => Object.keys(item)))];
    if (!itemKeys.length) itemKeys.push(...(emptyCollectionFields[key] ?? []));
    const fields = itemKeys.flatMap((itemKey) => {
      const sample = items.find((item) => item[itemKey] !== undefined)?.[itemKey] ?? "";
      if (typeof sample !== "string" && typeof sample !== "number") return [];
      return getContentFields({ [itemKey]: sample }, [itemKey], sectionType);
    });
    return [{ key, label: collectionTitle(sectionType, key), maxItems: maxItems[key], fields }];
  });
}

function collectionTitle(sectionType: string, key: string) {
  if (key === "items" && sectionType.endsWith("faq")) return "Perguntas frequentes";
  if (key === "items" && (sectionType.endsWith("testimonials") || sectionType.includes("reviews"))) return "Testemunhos e avaliações";
  if (key === "items" && sectionType.includes("menu")) return "Itens do menu";
  if (key === "items" && sectionType.includes("gallery")) return "Imagens da galeria";
  if (key === "items" && sectionType.includes("experience")) return "Etapas da experiência";
  if (key === "items" && sectionType.includes("signature")) return "Pratos em destaque";
  return collectionLabels[key] ?? "Itens";
}

export function getNewCollectionItem(sectionType: string, collectionKey: string, currentItems: ContentRecord[]) {
  const keys = new Set(currentItems.flatMap((item) => Object.keys(item)));
  if (!keys.size) {
    const profile = repeatableItemProfile(sectionType);
    const inferred = profile?.fields.map((field) => field.key) ?? (emptyCollectionFields[collectionKey] ?? ["title", "description"]);
    inferred.forEach((key) => keys.add(key));
  }
  const labelsInOrder = [...keys].filter((key) => labels[key]);
  return Object.fromEntries(labelsInOrder.map((key) => [key, ""]));
}

function repeatableItemProfile(sectionType?: string) {
  if (!sectionType) return undefined;
  if (sectionType === "restaurant_menu_highlights") return { fields: [
    { key: "category", maxLength: 80, required: true }, { key: "title", maxLength: 120, required: true },
    { key: "description", maxLength: 500, required: true }, { key: "price", maxLength: 40, required: false },
  ] };
  if (sectionType === "restaurant_reviews" || sectionType.endsWith("_testimonials") || sectionType === "testimonials") return { fields: [
    { key: "name", maxLength: 100, required: true }, { key: "quote", maxLength: 700, required: true }, { key: "context", maxLength: 120, required: false },
  ] };
  if (sectionType.endsWith("_faq") || sectionType === "faq") return { fields: [
    { key: "question", maxLength: 180, required: true }, { key: "answer", maxLength: 1200, required: true },
  ] };
  return undefined;
}

export function validateStructuredContent(sectionType: string, patch: unknown, allowedKeys: string[], existing?: unknown) {
  const record = asRecord(patch);
  const oldRecord = asRecord(existing);
  const unsupported = Object.keys(record).filter((key) => !allowedKeys.includes(key) || !isEditableContentKey(key, record[key]));
  if (unsupported.length) throw new Error("A secção contém campos que não são editáveis nesta versão do template.");
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" && value.length > (isUrlKey(key) ? 2000 : /alt/i.test(key) ? 300 : /text|description|answer|quote|address|hours/i.test(key) ? 1200 : 240)) {
      throw new Error(`O campo «${labels[key]}» excede o limite permitido.`);
    }
    if (typeof value === "string" && !optionalKeys.has(key) && !value.trim()) throw new Error(`Preenche o campo «${labels[key]}».`);
    if (typeof value === "string" && value.trim() && isUrlKey(key) && !isValidLinkField(key, value)) throw new Error(`Indica um endereço válido no campo «${labels[key]}».`);
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`O campo «${labels[key]}» tem de ser um número válido.`);
    if (Array.isArray(value)) {
      const limit = maxItems[key] ?? 0;
      if (!limit || value.length > limit || !value.every(isRecord)) throw new Error(`A lista «${collectionLabels[key] ?? key}» tem um formato ou dimensão inválidos.`);
      for (const [index, item] of value.entries()) {
        const oldItems = Array.isArray(oldRecord[key]) ? oldRecord[key] as unknown[] : [];
        const legacyFields = Object.entries(item).filter(([itemKey]) => !labels[itemKey]);
        const previousItem = asRecord(oldItems.find((old) => legacyFields.length > 0 && legacyFields.every(([itemKey, itemValue]) => JSON.stringify(asRecord(old)[itemKey]) === JSON.stringify(itemValue))) ?? oldItems[index]);
        const itemProfile = key === "items" ? repeatableItemProfile(sectionType) : undefined;
        const isNewItem = index >= oldItems.length && !oldItems.some((old) => old === previousItem);
        for (const field of itemProfile?.fields ?? []) {
          if (!field.required) continue;
          const currentValue = item[field.key];
          const previousValue = previousItem[field.key];
          const unchanged = JSON.stringify(currentValue) === JSON.stringify(previousValue);
          if ((isNewItem || !unchanged) && (typeof currentValue !== "string" || !currentValue.trim())) {
            throw new Error(`Preenche o campo «${labels[field.key]}» no item ${index + 1}.`);
          }
        }
        for (const [itemKey, itemValue] of Object.entries(item)) {
          const unchangedExistingValue = itemKey in previousItem && JSON.stringify(itemValue) === JSON.stringify(previousItem[itemKey]);
          if ((!labels[itemKey] && !unchangedExistingValue) || privateKeys.test(itemKey)) throw new Error("A lista contém um campo não editável.");
          if (!labels[itemKey] && !unchangedExistingValue) throw new Error("Os dados técnicos ou legados da lista não podem ser alterados.");
          if (!labels[itemKey]) continue;
          const profileField = itemProfile?.fields.find((field) => field.key === itemKey);
          const fieldLimit = profileField?.maxLength ?? (isUrlKey(itemKey) ? 2000 : /alt/i.test(itemKey) ? 300 : /text|description|answer|quote|address|hours/i.test(itemKey) ? 1200 : 240);
          if ((typeof itemValue !== "string" && typeof itemValue !== "number") || (typeof itemValue === "string" && itemValue.length > fieldLimit)) {
            throw new Error(`O campo «${labels[itemKey]}» tem um formato ou comprimento inválidos.`);
          }
          const optional = profileField ? !profileField.required : optionalKeys.has(itemKey);
          if (!optional && typeof itemValue === "string" && !itemValue.trim() && !unchangedExistingValue) throw new Error(`Preenche o campo «${labels[itemKey]}» no item ${index + 1}.`);
          if (typeof itemValue === "string" && itemValue.trim() && isUrlKey(itemKey) && !isValidLinkField(itemKey, itemValue)) throw new Error(`Indica um endereço válido em «${labels[itemKey]}» no item ${index + 1}.`);
        }
      }
    }
  }
  void sectionType;
}

function isValidLinkField(key: string, value: string) {
  if (/email/i.test(key)) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (/^(?:#|\/)/.test(value) || /^(?:mailto:|tel:)/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isUrlKey(key: string) {
  return /(?:url|href|website|email)/i.test(key) || (/image/i.test(key) && !/alt/i.test(key));
}

export function mergeStructuredContent(existing: unknown, patch: unknown) {
  const oldRecord = asRecord(existing);
  const nextRecord = asRecord(patch);
  const merged: ContentRecord = { ...oldRecord, ...nextRecord };
  for (const [key, value] of Object.entries(nextRecord)) {
    if (Array.isArray(value) && Array.isArray(oldRecord[key])) {
      const oldItems = oldRecord[key] as unknown[];
      merged[key] = value.map((item, index) => {
        const incoming = asRecord(item);
        const incomingLegacy = Object.entries(incoming).filter(([itemKey]) => !labels[itemKey]);
        const matched = oldItems.find((old) => incomingLegacy.length > 0 && incomingLegacy.every(([itemKey, itemValue]) => JSON.stringify(asRecord(old)[itemKey]) === JSON.stringify(itemValue)));
        const previous = asRecord(matched ?? oldItems[index]);
        const editable = Object.fromEntries(Object.entries(incoming).filter(([itemKey]) => Boolean(labels[itemKey]) && !privateKeys.test(itemKey)));
        return { ...previous, ...editable };
      });
    }
  }
  return merged;
}

export function asRecord(value: unknown): ContentRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ContentRecord : {};
}

function isRecord(value: unknown): value is ContentRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
