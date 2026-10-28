import type { ReactNode } from "react";

import { baseSectionRegistry } from "@/features/public-renderer/section-registry/base";
import { bakeryPlayfulSectionRegistry, BakeryPlayfulReveal } from "@/features/public-renderer/templates/bakery/bakery-playful";
import "@/features/public-renderer/templates/bakery/bakery-playful.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: { ...baseSectionRegistry, ...bakeryPlayfulSectionRegistry },
  wrapSections: (children: ReactNode) => <BakeryPlayfulReveal>{children}</BakeryPlayfulReveal>,
};
