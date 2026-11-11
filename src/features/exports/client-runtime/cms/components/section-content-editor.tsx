"use client";

import { useState, useTransition, type FormEvent } from "react";

import { asRecord, editableContentKeys } from "../content-editor-schema";
import { StructuredContentFields } from "./structured-content-fields";

type SaveResult = { ok: boolean; message: string };
type SaveAction = (formData: FormData) => Promise<SaveResult>;

const sectionLabels: Record<string, string> = {
  hero: "Destaque inicial", features: "Vantagens", services: "Serviços", process: "Processo", testimonials: "Testemunhos",
  faq: "Perguntas frequentes", gallery: "Galeria", video: "Vídeo", team: "Equipa", stats: "Indicadores", pricing: "Preços",
  contact: "Contacto", map: "Mapa", cta: "Chamada para ação", real_estate_hero: "Destaque imobiliário", featured_properties: "Imóveis em destaque",
  property_highlights: "Vantagens do imóvel", property_valuation: "Avaliação imobiliária", local_area_expertise: "Conhecimento local",
  real_estate_agents: "Consultores imobiliários", real_estate_process: "Processo imobiliário", luxury_advisory: "Consultoria imobiliária premium",
  clinic_hero: "Destaque da clínica", clinic_specialties: "Especialidades clínicas", clinic_doctors: "Equipa clínica", clinic_credentials: "Credenciais clínicas",
  clinic_patient_journey: "Percurso do paciente", clinic_facilities: "Instalações", clinic_locations: "Localizações", clinic_booking: "Marcações",
  clinic_private_experience: "Experiência da clínica", restaurant_hero: "Destaque do restaurante", restaurant_reviews: "Avaliações do restaurante",
  restaurant_menu_highlights: "Destaques do menu", restaurant_signature_dishes: "Pratos de assinatura", restaurant_experience: "Ambiente e experiência",
  restaurant_chef_story: "História do chef", restaurant_reservation: "Reservas", restaurant_location: "Localização", restaurant_gallery: "Galeria do restaurante",
  bakery_hero: "Destaque da pastelaria", bakery_products: "Produtos da pastelaria", bakery_featured_products: "Produtos em destaque",
  bakery_celebration: "Encomendas para celebrações", bakery_story: "História da pastelaria", bakery_gallery: "Galeria da pastelaria",
  bakery_testimonials: "Testemunhos", bakery_opening_hours: "Horário de funcionamento", bakery_seasonal_offers: "Ofertas sazonais",
  bakery_faq: "Perguntas frequentes", bakery_contact: "Contacto da pastelaria", gym_hero: "Destaque do estúdio", gym_method: "Método de treino",
  gym_values_rail: "Valores do estúdio", gym_space: "Espaço de treino", gym_schedule: "Horário", gym_benefits: "Benefícios", gym_programs: "Programas de treino",
  gym_classes: "Aulas e modalidades", gym_coaches: "Treinadores", gym_plans: "Planos de treino", gym_transformations: "Transformações",
  gym_testimonials: "Testemunhos do estúdio", gym_trial: "Aula experimental", gym_faq: "Perguntas frequentes", gym_contact: "Contacto do estúdio",
};

export function clientCmsStructuredSectionTypes() {
  return Object.keys(sectionLabels);
}

export function clientCmsSectionTypeLabel(sectionType: string) {
  return sectionLabels[sectionType] ?? "Secção personalizada";
}

export function repeatableCollectionLabel(sectionType: string) {
  if (sectionType.includes("menu")) return "Itens do menu";
  if (sectionType === "faq" || sectionType.endsWith("_faq")) return "Perguntas frequentes";
  if (sectionType === "restaurant_reviews") return "Avaliações";
  if (sectionType === "restaurant_experience") return "Etapas da experiência";
  if (sectionType === "restaurant_gallery") return "Imagens da galeria";
  if (sectionType === "restaurant_reservation") return "Informações da reserva";
  if (sectionType === "restaurant_signature_dishes") return "Pratos e experiências em destaque";
  if (sectionType.endsWith("_testimonials")) return "Testemunhos";
  return "Itens";
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
  const [content, setContent] = useState(() => asRecord(section.content));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<SaveResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("content", JSON.stringify(Object.fromEntries(editableFields.filter((key) => key in content).map((key) => [key, content[key]]))));
    setFeedback(null);
    startTransition(async () => {
      try {
        setFeedback(await saveAction(formData));
      } catch {
        setFeedback({ ok: false, message: "Não foi possível guardar a secção. O conteúdo mantém-se; verifica a ligação e tenta novamente." });
      }
    });
  }

  const unsupported = editableFields.filter((key) => !editableContentKeys({ [key]: content[key] }).includes(key));

  return (
    <form className="grid min-w-0 gap-4 border border-border p-4" onChange={() => setFeedback(null)} onSubmit={handleSubmit}>
      <h2 className="font-semibold">{sectionLabels[section.section_type] ?? section.name}</h2>
      <input name="pageId" type="hidden" value={pageId} />
      <input name="sectionId" type="hidden" value={section.id} />
      <StructuredContentFields idPrefix={`client-section-${section.id}`} sectionType={section.section_type} content={content} editableFields={editableFields} disabled={pending} onChange={setContent} />
      {unsupported.length ? <p className="text-sm text-muted-foreground" role="status">Alguns campos deste conteúdo não têm editor seguro nesta versão e foram preservados sem alteração.</p> : null}
      <button className="min-h-10 w-fit bg-primary px-4 text-primary-foreground disabled:opacity-60" disabled={pending || editableFields.length === 0} type="submit">{pending ? "A guardar…" : "Guardar secção"}</button>
      {pending ? <p aria-live="polite" role="status">A guardar secção…</p> : feedback ? <p role={feedback.ok ? "status" : "alert"}>{feedback.message}</p> : null}
    </form>
  );
}
