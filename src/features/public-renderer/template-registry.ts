import type { PublicRendererContext } from "@/features/public-renderer/types";

export type TemplateDefinition = {
  key: string;
  supportedSections: string[];
};

const defaultSupportedSections = [
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
];

const realEstateSupportedSections = [
  ...defaultSupportedSections,
  "real_estate_hero",
  "featured_properties",
  "property_highlights",
  "property_valuation",
  "local_area_expertise",
  "real_estate_agents",
  "real_estate_process",
  "luxury_advisory",
];

const clinicSupportedSections = [
  ...defaultSupportedSections,
  "clinic_hero",
  "clinic_specialties",
  "clinic_doctors",
  "clinic_credentials",
  "clinic_patient_journey",
  "clinic_facilities",
  "clinic_locations",
  "clinic_booking",
  "clinic_private_experience",
];

const restaurantSupportedSections = [
  ...defaultSupportedSections,
  "restaurant_hero",
  "restaurant_menu_highlights",
  "restaurant_signature_dishes",
  "restaurant_experience",
  "restaurant_chef_story",
  "restaurant_reviews",
  "restaurant_reservation",
  "restaurant_location",
  "restaurant_gallery",
];

const bakerySupportedSections = [
  ...defaultSupportedSections,
  "bakery_hero",
  "bakery_products",
  "bakery_featured_products",
  "bakery_celebration",
  "bakery_story",
  "bakery_gallery",
  "bakery_testimonials",
  "bakery_opening_hours",
  "bakery_seasonal_offers",
  "bakery_faq",
  "bakery_contact",
];

const gymSupportedSections = [
  ...defaultSupportedSections,
  "gym_hero",
  "gym_method",
  "gym_values_rail",
  "gym_space",
  "gym_schedule",
  "gym_benefits",
  "gym_programs",
  "gym_classes",
  "gym_coaches",
  "gym_plans",
  "gym_transformations",
  "gym_testimonials",
  "gym_trial",
  "gym_faq",
  "gym_contact",
];

const templates: Record<string, TemplateDefinition> = {
  base: { key: "base", supportedSections: defaultSupportedSections },
  universal: { key: "universal", supportedSections: defaultSupportedSections },
  universal_base: {
    key: "universal_base",
    supportedSections: defaultSupportedSections,
  },
  real_estate: {
    key: "real_estate",
    supportedSections: realEstateSupportedSections,
  },
  clinic: { key: "clinic", supportedSections: clinicSupportedSections },
  restaurant: {
    key: "restaurant",
    supportedSections: restaurantSupportedSections,
  },
  bakery: { key: "bakery", supportedSections: bakerySupportedSections },
  gym: { key: "gym", supportedSections: gymSupportedSections },
  construction: { key: "construction", supportedSections: defaultSupportedSections },
  beauty: { key: "beauty", supportedSections: defaultSupportedSections },
};

export function resolveTemplate(context: PublicRendererContext) {
  return templates[context.page.template?.key ?? "base"] ?? templates.base;
}
