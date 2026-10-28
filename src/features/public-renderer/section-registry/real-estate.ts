import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  FeaturedPropertiesSection,
  LocalAreaExpertiseSection,
  LuxuryAdvisorySection,
  PropertyHighlightsSection,
  PropertyValuationSection,
  RealEstateAgentsSection,
  RealEstateHeroSection,
  RealEstateProcessSection,
} from "@/features/public-renderer/templates/real-estate";

export const realEstateSectionRegistry: Record<string, React.ComponentType<PublicSectionProps>> = {
  ...baseSectionRegistry,
  real_estate_hero: RealEstateHeroSection,
  featured_properties: FeaturedPropertiesSection,
  property_highlights: PropertyHighlightsSection,
  property_valuation: PropertyValuationSection,
  local_area_expertise: LocalAreaExpertiseSection,
  real_estate_agents: RealEstateAgentsSection,
  real_estate_process: RealEstateProcessSection,
  luxury_advisory: LuxuryAdvisorySection,
};
