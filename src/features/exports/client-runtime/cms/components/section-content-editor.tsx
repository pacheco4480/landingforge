"use client";

import { useState, useTransition, type FormEvent } from "react";

type RecordValue = Record<string, unknown>;
type SaveResult = { ok: boolean; message: string };
type SaveAction = (formData: FormData) => Promise<SaveResult>;
type FieldProfile = { key: string; label: string; max: number; multiline?: boolean; url?: boolean; required?: boolean };
type CollectionProfile = { key: string; label: string; maxItems: number; fields: FieldProfile[] };
type SectionProfile = { fields: FieldProfile[]; collection?: CollectionProfile };

const itemCollection = (label: string, maxItems: number, fields: FieldProfile[]): CollectionProfile => ({
  key: "items", label, maxItems, fields,
});

const profiles: Record<string, SectionProfile> = {
  faq: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Perguntas frequentes", 30, [{ key: "question", label: "Pergunta", max: 180 }, { key: "answer", label: "Resposta", max: 1200, multiline: true }]) },
  testimonials: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Testemunhos", 30, [{ key: "name", label: "Nome apresentado", max: 100 }, { key: "quote", label: "Testemunho", max: 700, multiline: true }, { key: "context", label: "Contexto (opcional)", max: 120, required: false }]) },
  restaurant_reviews: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Avaliações", 30, [{ key: "name", label: "Nome apresentado", max: 100 }, { key: "quote", label: "Avaliação", max: 700, multiline: true }, { key: "context", label: "Contexto (opcional)", max: 120, required: false }]) },
  restaurant_menu_highlights: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Itens do menu", 30, [{ key: "category", label: "Categoria", max: 80 }, { key: "title", label: "Nome do prato ou bebida", max: 120 }, { key: "description", label: "Descrição", max: 500, multiline: true }, { key: "price", label: "Preço ou indicação (opcional)", max: 40, required: false }]) },
  restaurant_hero: { fields: [
    { key: "brandName", label: "Nome do restaurante", max: 100 }, { key: "eyebrow", label: "Texto de apoio", max: 120 },
    { key: "headline", label: "Título principal", max: 180 }, { key: "subheadline", label: "Descrição principal", max: 1000, multiline: true },
    { key: "ctaPrimary", label: "Texto do botão principal", max: 80 }, { key: "ctaSecondary", label: "Texto do botão secundário", max: 80 },
    { key: "heroImage", label: "Endereço da imagem principal", max: 2000, url: true, required: false }, { key: "heroImageAlt", label: "Texto alternativo da imagem principal", max: 300, required: false },
    { key: "secondaryImage", label: "Endereço da imagem complementar", max: 2000, url: true, required: false }, { key: "secondaryImageAlt", label: "Texto alternativo da imagem complementar", max: 300, required: false },
    { key: "proofLabel", label: "Etiqueta de confiança", max: 120 }, { key: "proofText", label: "Informação de confiança", max: 400, multiline: true },
  ] },
  restaurant_signature_dishes: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Pratos e experiências em destaque", 30, [
    { key: "label", label: "Categoria", max: 80 }, { key: "title", label: "Título", max: 140 }, { key: "description", label: "Descrição", max: 600, multiline: true },
    { key: "image", label: "Endereço da imagem", max: 2000, url: true, required: false }, { key: "imageAlt", label: "Texto alternativo da imagem", max: 300, required: false },
  ]) },
  restaurant_experience: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Etapas da experiência", 12, [
    { key: "title", label: "Título da etapa", max: 140 }, { key: "description", label: "Descrição", max: 600, multiline: true },
  ]) },
  restaurant_gallery: { fields: [{ key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true }], collection: itemCollection("Imagens da galeria", 30, [
    { key: "label", label: "Legenda", max: 120 }, { key: "description", label: "Descrição", max: 500, multiline: true, required: false },
    { key: "image", label: "Endereço da imagem", max: 2000, url: true }, { key: "imageAlt", label: "Texto alternativo da imagem", max: 300 },
  ]) },
  restaurant_reservation: { fields: [
    { key: "eyebrow", label: "Texto de apoio", max: 120 }, { key: "title", label: "Título", max: 180 },
    { key: "text", label: "Descrição", max: 1000, multiline: true }, { key: "ctaPrimary", label: "Texto do botão", max: 80 },
  ], collection: { key: "details", label: "Informações da reserva", maxItems: 12, fields: [
    { key: "label", label: "Etiqueta", max: 100 }, { key: "value", label: "Informação", max: 240 },
  ] } },
  restaurant_location: { fields: [
    { key: "title", label: "Título", max: 180 }, { key: "text", label: "Introdução", max: 1000, multiline: true },
    { key: "address", label: "Morada", max: 300, multiline: true }, { key: "hours", label: "Horário", max: 300, multiline: true },
    { key: "reservationNote", label: "Nota sobre reservas", max: 400, multiline: true }, { key: "mapQuery", label: "Pesquisa do mapa", max: 300 },
  ] },
};

function profileFor(sectionType: string) {
  if (sectionType.endsWith("_faq") && !profiles[sectionType]) return profiles.faq;
  if (sectionType.endsWith("_testimonials") && !profiles[sectionType]) return profiles.testimonials;
  return profiles[sectionType] ?? null;
}

export function clientCmsStructuredSectionTypes() {
  return Object.keys(profiles);
}

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function itemList(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export function repeatableCollectionLabel(sectionType: string) {
  if (sectionType.includes("menu")) return "Itens do menu";
  if (sectionType === "faq" || sectionType.endsWith("_faq")) return "Perguntas frequentes";
  if (sectionType === "restaurant_reviews") return "Avaliações";
  if (sectionType === "restaurant_experience") return "Etapas da experiência";
  if (sectionType === "restaurant_gallery") return "Imagens da galeria";
  if (sectionType === "restaurant_reservation") return "Informações da reserva";
  if (sectionType === "restaurant_signature_dishes") return "Pratos e experiências em destaque";
  return "Testemunhos";
}

export function clientCmsSectionTypeLabel(sectionType: string) {
  const labels: Record<string, string> = {
    hero: "Destaque inicial", features: "Vantagens", services: "Serviços", process: "Processo",
    testimonials: "Testemunhos", faq: "Perguntas frequentes", gallery: "Galeria", video: "Vídeo",
    team: "Equipa", stats: "Indicadores", pricing: "Preços", contact: "Contacto", map: "Mapa", cta: "Chamada para ação",
    restaurant_reviews: "Avaliações do restaurante", restaurant_menu_highlights: "Destaques do menu",
    real_estate_hero: "Destaque imobiliário", featured_properties: "Imóveis em destaque", property_highlights: "Vantagens do imóvel",
    property_valuation: "Avaliação imobiliária", local_area_expertise: "Conhecimento local", real_estate_agents: "Consultores imobiliários",
    real_estate_process: "Processo de compra ou venda", luxury_advisory: "Consultoria imobiliária premium",
    clinic_hero: "Destaque da clínica", clinic_specialties: "Especialidades clínicas", clinic_doctors: "Equipa clínica",
    clinic_credentials: "Credenciais clínicas", clinic_patient_journey: "Percurso do paciente", clinic_facilities: "Instalações",
    clinic_locations: "Localizações", clinic_booking: "Marcação de consulta", clinic_private_experience: "Experiência privada",
    restaurant_hero: "Destaque do restaurante", restaurant_signature_dishes: "Pratos de assinatura", restaurant_experience: "Ambiente e experiência",
    restaurant_chef_story: "História do chef", restaurant_reservation: "Reservas", restaurant_location: "Localização", restaurant_gallery: "Galeria do restaurante",
    bakery_hero: "Destaque da pastelaria", bakery_products: "Produtos da pastelaria", bakery_featured_products: "Produtos em destaque",
    bakery_celebration: "Encomendas para celebrações", bakery_story: "História da pastelaria", bakery_gallery: "Galeria da pastelaria",
    bakery_testimonials: "Testemunhos", bakery_opening_hours: "Horário de funcionamento", bakery_seasonal_offers: "Ofertas sazonais",
    bakery_faq: "Perguntas frequentes", bakery_contact: "Contacto da pastelaria", gym_hero: "Destaque do estúdio", gym_method: "Método de treino",
    gym_values_rail: "Valores do estúdio", gym_space: "Espaço de treino", gym_schedule: "Horário", gym_benefits: "Benefícios",
    gym_programs: "Programas de treino", gym_classes: "Aulas e modalidades", gym_coaches: "Treinadores", gym_plans: "Planos de treino",
    gym_transformations: "Transformações", gym_testimonials: "Testemunhos do estúdio", gym_trial: "Aula experimental", gym_faq: "Perguntas frequentes", gym_contact: "Contacto do estúdio",
  };
  return labels[sectionType] ?? "Secção personalizada";
}

function fieldValue(item: RecordValue, field: FieldProfile) {
  return typeof item[field.key] === "string" ? item[field.key] as string : "";
}

export function SectionContentEditor({
  pageId,
  section,
  editableFields,
  saveAction,
}: {
  pageId: string;
  section: { id: string; name: string; section_type: string; content: unknown };
  editableFields: string[];
  saveAction: SaveAction;
}) {
  const [content, setContent] = useState<RecordValue>(() => record(section.content));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<SaveResult | null>(null);
  const profile = profileFor(section.section_type);
  const collection = profile?.collection;
  const canEditCollection = Boolean(collection && editableFields.includes(collection.key));
  const items = collection ? itemList(content[collection.key]) : [];
  const editableProfileFields = profile?.fields.filter((field) => editableFields.includes(field.key)) ?? [];
  const usesStructuredEditor = editableProfileFields.length > 0 || canEditCollection;
  const patch = Object.fromEntries(editableFields.filter((key) => key in content).map((key) => [key, content[key]]));

  function updateItem(index: number, key: string, value: string) {
    if (!collection) return;
    setContent((current) => {
      const next = itemList(current[collection.key]);
      next[index] = { ...next[index], [key]: value };
      return { ...current, [collection.key]: next };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("content", JSON.stringify({ ...patch, ...(collection && canEditCollection ? { [collection.key]: content[collection.key] } : {}) }));
    setFeedback(null);
    startTransition(async () => {
      try {
        setFeedback(await saveAction(formData));
      } catch {
        setFeedback({ ok: false, message: "Não foi possível guardar a secção. O conteúdo mantém-se; verifica a ligação e tenta novamente." });
      }
    });
  }

  return (
    <form className="grid gap-3 border p-4" onChange={() => setFeedback(null)} onSubmit={handleSubmit}>
      <h2 className="font-semibold">{clientCmsSectionTypeLabel(section.section_type)}</h2>
      <input name="pageId" type="hidden" value={pageId} />
      <input name="sectionId" type="hidden" value={section.id} />
      {usesStructuredEditor && profile ? (
        <>
          {editableProfileFields.map((field) => {
            const value = fieldValue(content, field);
            const common = { maxLength: field.max, required: field.required ?? true, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setContent((current) => ({ ...current, [field.key]: event.target.value })); setFeedback(null); } };
            return <label className="grid gap-2 text-sm" key={field.key}>{field.label}{field.multiline ? <textarea className="min-h-24 border p-3" {...common} /> : <input className="min-h-10 border px-3" type={field.url ? "url" : "text"} {...common} />}<span className="text-xs text-muted-foreground">{value.length}/{field.max} caracteres</span></label>;
          })}
          {canEditCollection && collection ? (
            <fieldset className="grid gap-4 border-t pt-4">
              <legend className="px-1 text-sm font-semibold">{collection.label} ({items.length}/{collection.maxItems})</legend>
              {items.map((item, index) => (
                <div className="grid gap-3 border p-4" key={`${section.id}-${collection.key}-${index}`}>
                  <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">Item {index + 1}</strong><div className="flex gap-2">
                    <button aria-label={`Mover item ${index + 1} para cima`} className="min-h-10 border px-3 disabled:opacity-50" disabled={pending || index === 0} onClick={() => setContent((current) => { const next = itemList(current[collection.key]); [next[index - 1], next[index]] = [next[index], next[index - 1]]; return { ...current, [collection.key]: next }; })} type="button">↑</button>
                    <button aria-label={`Mover item ${index + 1} para baixo`} className="min-h-10 border px-3 disabled:opacity-50" disabled={pending || index === items.length - 1} onClick={() => setContent((current) => { const next = itemList(current[collection.key]); [next[index + 1], next[index]] = [next[index], next[index + 1]]; return { ...current, [collection.key]: next }; })} type="button">↓</button>
                    <button aria-label={`Remover item ${index + 1}`} className="min-h-10 border border-red-700 px-3 text-red-800 disabled:opacity-50" disabled={pending} onClick={() => setContent((current) => ({ ...current, [collection.key]: itemList(current[collection.key]).filter((_, itemIndex) => itemIndex !== index) }))} type="button">Remover</button>
                  </div></div>
                  {collection.fields.map((field) => {
                    const value = fieldValue(item, field);
                    const common = { maxLength: field.max, required: field.required ?? true, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(index, field.key, event.target.value) };
                    return <label className="grid gap-2 text-sm" key={field.key}>{field.label}{field.multiline ? <textarea className="min-h-24 border p-3" {...common} /> : <input className="min-h-10 border px-3" type={field.url ? "url" : "text"} {...common} />}<span className="text-xs text-muted-foreground">{value.length}/{field.max} caracteres</span></label>;
                  })}
                </div>
              ))}
              {items.length === 0 ? <p className="text-sm text-muted-foreground" role="status">Ainda não existem itens nesta lista.</p> : null}
              <button className="min-h-10 w-fit border px-4 disabled:opacity-50" disabled={pending || items.length >= collection.maxItems} onClick={() => setContent((current) => ({ ...current, [collection.key]: [...itemList(current[collection.key]), Object.fromEntries(collection.fields.map((field) => [field.key, ""]))] }))} type="button">Adicionar item</button>
              {items.length >= collection.maxItems ? <p className="text-sm text-muted-foreground" role="status">Limite atingido: máximo de {collection.maxItems} itens nesta secção.</p> : null}
            </fieldset>
          ) : null}
          {editableFields.some((key) => !profile.fields.some((field) => field.key === key) && key !== collection?.key) ? <p className="text-sm text-muted-foreground">Os restantes campos técnicos são mantidos pelo template e não precisam de edição para atualizar este conteúdo.</p> : null}
        </>
      ) : (
        <label className="grid gap-2 text-sm">Campos editáveis (JSON)<textarea className="min-h-40 w-full border p-3 font-mono text-xs" name="content" required rows={Math.min(18, Math.max(6, JSON.stringify(section.content).length / 90))} defaultValue={JSON.stringify(Object.fromEntries(editableFields.map((key) => [key, record(section.content)[key]])), null, 2)} /></label>
      )}
      <button className="min-h-10 w-fit bg-primary px-4 text-primary-foreground disabled:opacity-60" disabled={pending} type="submit">{pending ? "A guardar…" : "Guardar secção"}</button>
      {pending ? <p aria-live="polite" role="status">A guardar secção…</p> : feedback ? <p role={feedback.ok ? "status" : "alert"}>{feedback.message}</p> : null}
    </form>
  );
}
