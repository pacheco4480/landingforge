import type { ComponentType } from "react";

import type { PublicSectionProps } from "@/features/public-renderer/types";
import {
  CardsSection,
  CtaSection,
  FaqSection,
  HeroSection,
  LegalSection,
  MapSection,
  StatsSection,
  VideoSection,
} from "@/features/public-renderer/components/sections/basic-sections";
import { ContactSection } from "@/features/public-renderer/components/sections/contact-section";

export const baseSectionRegistry: Record<string, ComponentType<PublicSectionProps>> = {
  hero: HeroSection,
  features: CardsSection,
  services: CardsSection,
  process: CardsSection,
  testimonials: CardsSection,
  faq: FaqSection,
  gallery: CardsSection,
  video: VideoSection,
  team: CardsSection,
  stats: StatsSection,
  pricing: CardsSection,
  contact: ContactSection,
  map: MapSection,
  cta: CtaSection,
  legal: LegalSection,
};
