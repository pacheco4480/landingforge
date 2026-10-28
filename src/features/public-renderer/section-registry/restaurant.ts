import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  RestaurantChefStorySection,
  RestaurantExperienceSection,
  RestaurantGallerySection,
  RestaurantHeroSection,
  RestaurantLocationSection,
  RestaurantMenuHighlightsSection,
  RestaurantReservationSection,
  RestaurantReviewsSection,
  RestaurantSignatureDishesSection,
} from "@/features/public-renderer/templates/restaurant";

export const restaurantSectionRegistry: Record<string, React.ComponentType<PublicSectionProps>> = {
  ...baseSectionRegistry,
  restaurant_hero: RestaurantHeroSection,
  restaurant_menu_highlights: RestaurantMenuHighlightsSection,
  restaurant_signature_dishes: RestaurantSignatureDishesSection,
  restaurant_experience: RestaurantExperienceSection,
  restaurant_chef_story: RestaurantChefStorySection,
  restaurant_reviews: RestaurantReviewsSection,
  restaurant_reservation: RestaurantReservationSection,
  restaurant_location: RestaurantLocationSection,
  restaurant_gallery: RestaurantGallerySection,
};
