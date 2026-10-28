import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  GymCoachesSection,
  GymContactSection,
  GymHeroSection,
  GymMethodSection,
  GymPlansSection,
  GymProgramsSection,
  GymResultsSection,
  GymScheduleSection,
  GymSpaceSection,
  GymTrialSection,
  GymValuesRailSection,
} from "@/features/public-renderer/templates/gym";
import { CardsSection, FaqSection } from "@/features/public-renderer/components/sections/basic-sections";

export const gymSectionRegistry: Record<string, React.ComponentType<PublicSectionProps>> = {
  ...baseSectionRegistry,
  gym_hero: GymHeroSection,
  gym_method: GymMethodSection,
  gym_values_rail: GymValuesRailSection,
  gym_space: GymSpaceSection,
  gym_schedule: GymScheduleSection,
  gym_benefits: GymResultsSection,
  gym_programs: GymProgramsSection,
  gym_classes: CardsSection,
  gym_coaches: GymCoachesSection,
  gym_plans: GymPlansSection,
  gym_transformations: CardsSection,
  gym_testimonials: CardsSection,
  gym_trial: GymTrialSection,
  gym_faq: FaqSection,
  gym_contact: GymContactSection,
};
