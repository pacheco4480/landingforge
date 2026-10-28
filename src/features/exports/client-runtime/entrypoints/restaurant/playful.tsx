import type { ReactNode } from "react";

import { restaurantSectionRegistry } from "@/features/public-renderer/section-registry/restaurant";
import { RestaurantPlayfulReveal } from "@/features/public-renderer/templates/restaurant/restaurant-playful";
import "@/features/public-renderer/templates/restaurant/restaurant-playful.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: restaurantSectionRegistry,
  wrapSections: (children: ReactNode) => <RestaurantPlayfulReveal>{children}</RestaurantPlayfulReveal>,
};
