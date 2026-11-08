type RepeatableProfile = {
  maxItems: number;
  fields: Array<{ key: string; maxLength: number; required: boolean }>;
};

const profiles: Record<string, RepeatableProfile> = {
  faq: { maxItems: 30, fields: [
    { key: "question", maxLength: 180, required: true },
    { key: "answer", maxLength: 1200, required: true },
  ] },
  testimonials: { maxItems: 30, fields: [
    { key: "name", maxLength: 100, required: true },
    { key: "quote", maxLength: 700, required: true },
    { key: "context", maxLength: 120, required: false },
  ] },
  restaurant_reviews: { maxItems: 30, fields: [
    { key: "name", maxLength: 100, required: true },
    { key: "quote", maxLength: 700, required: true },
    { key: "context", maxLength: 120, required: false },
  ] },
  restaurant_menu_highlights: { maxItems: 30, fields: [
    { key: "category", maxLength: 80, required: true },
    { key: "title", maxLength: 120, required: true },
    { key: "description", maxLength: 500, required: true },
    { key: "price", maxLength: 40, required: false },
  ] },
};

function profileFor(sectionType: string) {
  if (sectionType === "restaurant_reviews") return profiles.restaurant_reviews;
  if (sectionType === "restaurant_menu_highlights") return profiles.restaurant_menu_highlights;
  if (sectionType.endsWith("_faq") || sectionType === "faq") return profiles.faq;
  if (sectionType.endsWith("_testimonials") || sectionType === "testimonials") return profiles.testimonials;
  return null;
}

export function validateRepeatableSectionContent(sectionType: string, content: unknown) {
  const profile = profileFor(sectionType);
  if (!profile || !content || typeof content !== "object" || Array.isArray(content)) return;

  const record = content as Record<string, unknown>;
  if (!Array.isArray(record.items)) return;
  if (record.items.length > profile.maxItems) {
    throw new Error(`Esta secção suporta até ${profile.maxItems} itens.`);
  }

  for (const [index, item] of record.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`O item ${index + 1} tem um formato inválido.`);
    }
    const itemRecord = item as Record<string, unknown>;
    for (const field of profile.fields) {
      const value = itemRecord[field.key];
      if (value !== undefined && typeof value !== "string") {
        throw new Error(`O campo ${field.key} do item ${index + 1} tem um formato inválido.`);
      }
      const text = typeof value === "string" ? value.trim() : "";
      if (field.required && !text) {
        throw new Error(`Preenche ${field.key} no item ${index + 1}.`);
      }
      if (typeof value === "string" && value.length > field.maxLength) {
        throw new Error(`${field.key} no item ${index + 1} excede ${field.maxLength} caracteres.`);
      }
    }
  }
}
