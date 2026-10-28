import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  BakeryCelebrationSection,
  BakeryContactSection,
  BakeryFeaturedProductsSection,
  BakeryGallerySection,
  BakeryHeroSection,
  BakeryOpeningHoursSection,
  BakeryProductsSection,
  BakerySeasonalOffersSection,
  BakeryStorySection,
  BakeryTestimonialsSection,
} from "@/features/public-renderer/templates/bakery";
import { FaqSection } from "@/features/public-renderer/components/sections/basic-sections";

export const bakerySectionRegistry: Record<string, React.ComponentType<PublicSectionProps>> = {
  ...baseSectionRegistry,
  bakery_hero: BakeryHeroSection,
  bakery_products: BakeryProductsSection,
  bakery_featured_products: BakeryFeaturedProductsSection,
  bakery_story: BakeryStorySection,
  bakery_gallery: BakeryGallerySection,
  bakery_testimonials: BakeryTestimonialsSection,
  bakery_opening_hours: BakeryOpeningHoursSection,
  bakery_seasonal_offers: BakerySeasonalOffersSection,
  bakery_faq: FaqSection,
  bakery_contact: BakeryContactSection,
  bakery_celebration: BakeryCelebrationSection,
};
