import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import { bakerySectionRegistry } from "@/features/public-renderer/section-registry/bakery";
import { clinicSectionRegistry } from "@/features/public-renderer/section-registry/clinic";
import { gymSectionRegistry } from "@/features/public-renderer/section-registry/gym";
import { realEstateSectionRegistry } from "@/features/public-renderer/section-registry/real-estate";
import { restaurantSectionRegistry } from "@/features/public-renderer/section-registry/restaurant";

export const sectionRegistry = {
  ...baseSectionRegistry,
  ...realEstateSectionRegistry,
  ...clinicSectionRegistry,
  ...restaurantSectionRegistry,
  ...bakerySectionRegistry,
  ...gymSectionRegistry,
};
