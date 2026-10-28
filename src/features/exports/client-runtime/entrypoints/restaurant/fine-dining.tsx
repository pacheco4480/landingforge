import type { ReactNode } from "react";

import { restaurantSectionRegistry } from "@/features/public-renderer/section-registry/restaurant";
import { FineDiningReveal } from "@/features/public-renderer/templates/restaurant/restaurant-fine-dining";
import "@/features/public-renderer/templates/restaurant/restaurant-fine-dining.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: restaurantSectionRegistry,
  wrapSections: (children: ReactNode) => <FineDiningReveal>{children}</FineDiningReveal>,
};
