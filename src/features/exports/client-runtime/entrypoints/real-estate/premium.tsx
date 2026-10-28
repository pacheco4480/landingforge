import type { ReactNode } from "react";

import { realEstateSectionRegistry } from "@/features/public-renderer/section-registry/real-estate";
import { EstateMotion } from "@/features/public-renderer/templates/real-estate/estate-motion";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: realEstateSectionRegistry,
  wrapSections: (children: ReactNode) => <EstateMotion premium>{children}</EstateMotion>,
};
