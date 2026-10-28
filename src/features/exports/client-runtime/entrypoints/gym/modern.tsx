import type { ReactNode } from "react";

import { gymModernSectionRegistry, GymModernReveal } from "@/features/public-renderer/templates/gym/gym-modern";
import "@/features/public-renderer/templates/gym/gym-modern.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: gymModernSectionRegistry,
  wrapSections: (children: ReactNode) => <GymModernReveal>{children}</GymModernReveal>,
};
