export const sectionTypes = [
  "hero",
  "features",
  "services",
  "process",
  "testimonials",
  "faq",
  "gallery",
  "video",
  "team",
  "stats",
  "pricing",
  "contact",
  "map",
  "cta",
] as const;

export type SectionType = (typeof sectionTypes)[number];

const sectionLabels: Record<string, string> = {
  hero: "Destaque inicial",
  features: "Vantagens",
  services: "Serviços",
  process: "Processo",
  testimonials: "Testemunhos",
  faq: "Perguntas frequentes",
  gallery: "Galeria",
  video: "Vídeo",
  team: "Equipa",
  stats: "Indicadores",
  pricing: "Preços",
  contact: "Contacto",
  map: "Mapa",
  cta: "Chamada para ação",
  restaurant_reviews: "Avaliações do restaurante",
  restaurant_menu_highlights: "Destaques do menu",
  restaurant_menu: "Menu do restaurante",
  bakery_menu: "Menu da pastelaria",
  clinic_services: "Serviços clínicos",
  clinic_team: "Equipa clínica",
  real_estate_properties: "Imóveis",
  real_estate_hero: "Destaque imobiliário",
  featured_properties: "Imóveis em destaque",
  property_highlights: "Vantagens do imóvel",
  property_valuation: "Avaliação imobiliária",
  local_area_expertise: "Conhecimento local",
  real_estate_agents: "Consultores imobiliários",
  real_estate_process: "Processo de compra ou venda",
  luxury_advisory: "Consultoria imobiliária premium",
  clinic_hero: "Destaque da clínica",
  clinic_specialties: "Especialidades clínicas",
  clinic_doctors: "Equipa clínica",
  clinic_credentials: "Credenciais clínicas",
  clinic_patient_journey: "Percurso do paciente",
  clinic_facilities: "Instalações",
  clinic_locations: "Localizações",
  clinic_booking: "Marcação de consulta",
  clinic_private_experience: "Experiência privada",
  restaurant_hero: "Destaque do restaurante",
  restaurant_signature_dishes: "Pratos de assinatura",
  restaurant_experience: "Ambiente e experiência",
  restaurant_chef_story: "História do chef",
  restaurant_reservation: "Reservas",
  restaurant_location: "Localização",
  restaurant_gallery: "Galeria do restaurante",
  bakery_hero: "Destaque da pastelaria",
  bakery_products: "Produtos da pastelaria",
  bakery_featured_products: "Produtos em destaque",
  bakery_celebration: "Encomendas para celebrações",
  bakery_story: "História da pastelaria",
  bakery_gallery: "Galeria da pastelaria",
  bakery_testimonials: "Testemunhos",
  bakery_opening_hours: "Horário de funcionamento",
  bakery_seasonal_offers: "Ofertas sazonais",
  bakery_faq: "Perguntas frequentes",
  bakery_contact: "Contacto da pastelaria",
  gym_hero: "Destaque do estúdio",
  gym_method: "Método de treino",
  gym_values_rail: "Valores do estúdio",
  gym_space: "Espaço de treino",
  gym_schedule: "Horário",
  gym_benefits: "Benefícios",
  gym_programs: "Programas de treino",
  gym_coaches: "Treinadores",
  gym_plans: "Planos de treino",
  gym_transformations: "Transformações",
  gym_testimonials: "Testemunhos do estúdio",
  gym_trial: "Aula experimental",
  gym_faq: "Perguntas frequentes",
  gym_contact: "Contacto do estúdio",
  gym_classes: "Aulas e modalidades",
};

export function sectionTypeLabel(type: string) {
  return sectionLabels[type] ?? "Secção personalizada";
}

export const sectionTypeOptions = sectionTypes.map((type) => ({
  value: type,
  label: sectionTypeLabel(type),
}));

export function createDefaultSectionContent(type: SectionType) {
  switch (type) {
    case "hero":
      return {
        headline: "Your headline",
        subheadline: "Explain the core offer clearly.",
        ctaPrimary: "Get started",
        ctaSecondary: "Learn more",
      };
    case "faq":
      return {
        title: "Frequently asked questions",
        items: [
          {
            question: "What should visitors know?",
            answer: "Add a clear answer.",
          },
        ],
      };
    case "testimonials":
      return {
        title: "What clients say",
        items: [{ name: "Client Name", quote: "Add a short testimonial." }],
      };
    case "services":
      return {
        title: "Services",
        items: [
          { title: "Service name", description: "Describe the service." },
        ],
      };
    case "contact":
      return {
        title: "Contact us",
        email: "hello@example.com",
        phone: "",
        address: "",
      };
    case "cta":
      return {
        headline: "Ready to take the next step?",
        ctaPrimary: "Contact us",
      };
    default:
      return {
        title:
          sectionTypeOptions.find((option) => option.value === type)?.label ??
          type,
        text: "Add content for this section.",
      };
  }
}

export function createDefaultSectionSettings() {
  return {
    layout: "standard",
    spacing: "medium",
  };
}
